//
//  APIClient.swift
//  Budgie
//
//  URLSession wrapper: cookie replay, Set-Cookie capture, typed JSON decoding.
//  Session cookie is kept in `SessionCookieBox` (Keychain-backed by SessionStore).
//

import Foundation

struct CookiePair: Codable, Equatable {
    var name: String
    var value: String
}

/// Thread-safe holder read/written by APIClient on every request.
final class SessionCookieBox: @unchecked Sendable {
    static let shared = SessionCookieBox()
    private let lock = NSLock()
    private var storage: CookiePair?

    var pair: CookiePair? {
        get { lock.lock(); defer { lock.unlock() }; return storage }
        set { lock.lock(); defer { lock.unlock() }; storage = newValue }
    }
}

extension Notification.Name {
    static let budgieCookieUpdated = Notification.Name("budgie.cookieUpdated")
    static let budgieSessionExpired = Notification.Name("budgie.sessionExpired")
}

struct APIRequest {
    var method: String = "GET"
    var path: String
    var queryItems: [URLQueryItem] = []
    var body: (any Encodable)?
    /// Initial sign-in/sign-up must send neither Cookie nor Origin (CSRF origin check).
    var includeCookie = true
    var includeOrigin = false
}

enum APIClient {
    static let baseURL = URL(string: "https://budgiez.vercel.app")!
    static let apiURL = baseURL.appendingPathComponent("api")

    private static let session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 30
        config.httpCookieStorage = nil
        return URLSession(configuration: config)
    }()

    // MARK: - Typed requests

    static func send<T: Decodable>(_ req: APIRequest, as type: T.Type) async throws -> T {
        let (data, response) = try await perform(req)
        captureCookies(from: response)
        try validate(response, data: data)
        return try decode(T.self, from: data)
    }

    /// For endpoints that return a `null` body on success (get-session).
    static func sendOptional<T: Decodable>(_ req: APIRequest, as type: T.Type) async throws -> T? {
        let (data, response) = try await perform(req)
        captureCookies(from: response)
        try validate(response, data: data)
        let text = String(data: data, encoding: .utf8)?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if text == "null" || text.isEmpty { return nil }
        return try decode(T.self, from: data)
    }

    static func sendNoContent(_ req: APIRequest) async throws {
        let (data, response) = try await perform(req)
        captureCookies(from: response)
        try validate(response, data: data)
    }

    // MARK: - Internals

    private static func makeRequest(_ req: APIRequest) throws -> URLRequest {
        guard var url = URL(string: req.path, relativeTo: apiURL) else {
            throw BudgieError.unknown
        }
        if !req.queryItems.isEmpty {
            url = url.appending(queryItems: req.queryItems)
        }
        var request = URLRequest(url: url)
        request.httpMethod = req.method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if req.includeCookie, let pair = SessionCookieBox.shared.pair {
            request.setValue("\(pair.name)=\(pair.value)", forHTTPHeaderField: "Cookie")
        }
        if req.includeOrigin {
            request.setValue(baseURL.absoluteString, forHTTPHeaderField: "Origin")
        }
        if let body = req.body {
            request.httpBody = try JSONCoding.encoder.encode(body)
        }
        return request
    }

    private static func perform(_ req: APIRequest) async throws -> (Data, URLResponse) {
        do {
            return try await session.data(for: try makeRequest(req))
        } catch let error as BudgieError {
            throw error
        } catch {
            throw BudgieError.network(error.localizedDescription)
        }
    }

    private static func validate(_ response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { throw BudgieError.unknown }
        guard (200...299).contains(http.statusCode) else {
            if http.statusCode == 401 {
                NotificationCenter.default.post(name: .budgieSessionExpired, object: nil)
            }
            throw BudgieError.parse(status: http.statusCode, data: data)
        }
    }

    /// Keep the session cookie fresh: any `Set-Cookie` for the session token wins.
    private static func captureCookies(from response: URLResponse) {
        guard let http = response as? HTTPURLResponse,
              let setCookies = http.value(forHTTPHeaderField: "Set-Cookie") else { return }
        for part in setCookies.split(separator: ",") {
            let trimmed = part.trimmingCharacters(in: .whitespaces)
            guard let eq = trimmed.firstIndex(of: "=") else { continue }
            let name = String(trimmed[..<eq])
            guard name.contains("session_token") else { continue }
            let value = String(trimmed[trimmed.index(after: eq)...])
                .split(separator: ";").first.map(String.init) ?? ""
            guard !value.isEmpty else { continue }
            SessionCookieBox.shared.pair = CookiePair(name: name, value: value)
            NotificationCenter.default.post(name: .budgieCookieUpdated, object: nil)
        }
    }

    private static func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try JSONCoding.decoder.decode(T.self, from: data)
        } catch {
            let preview = String(data: data, encoding: .utf8)?.prefix(200) ?? ""
            throw BudgieError.decoding("Failed to decode \(type): \(preview)")
        }
    }
}
