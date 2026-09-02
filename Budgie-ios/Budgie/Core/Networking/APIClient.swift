import Foundation

struct CookiePair: Codable, Equatable {
    var name: String
    var value: String
}

/// Thread-safe holder for the session cookie; APIClient reads/writes this on every request.
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
    static let budgieSessionExpired = Notification.Name("budgie.sessionExpired")
    static let budgieCookieUpdated = Notification.Name("budgie.cookieUpdated")
}

struct APIRequest {
    var method: String = "GET"
    var path: String
    var queryItems: [URLQueryItem] = []
    var body: (any Encodable)?
    var includeCookie = true
    var includeOrigin = false

    init(method: String = "GET", path: String, queryItems: [URLQueryItem] = [],
         body: (any Encodable)? = nil, includeCookie: Bool = true, includeOrigin: Bool = false) {
        self.method = method
        self.path = path
        self.queryItems = queryItems
        self.body = body
        self.includeCookie = includeCookie
        self.includeOrigin = includeOrigin
    }
}

enum APIClient {
    static let baseURL = URL(string: "https://budgiez.vercel.app")!
    static let apiURL = baseURL.appendingPathComponent("api")

    private static var session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 30
        config.httpCookieStorage = nil
        return URLSession(configuration: config)
    }()

    // MARK: - Core request

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
            request.httpBody = try DateFormatters.encoder.encode(body)
        }
        return request
    }

    /// Capture any new session_token Set-Cookie and store it.
    private static func captureCookies(from response: URLResponse) {
        guard let http = response as? HTTPURLResponse,
              let setCookies = http.value(forHTTPHeaderField: "Set-Cookie") else { return }
        let parts = setCookies.split(separator: ",")
        for part in parts {
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

    // MARK: - Typed sends

    static func send<T: Decodable>(_ req: APIRequest, as type: T.Type) async throws -> T {
        let (data, response) = try await perform(req)
        captureCookies(from: response)
        let http = response as! HTTPURLResponse
        guard (200...299).contains(http.statusCode) else {
            let error = BudgieError.parse(status: http.statusCode, data: data)
            if http.statusCode == 401 {
                NotificationCenter.default.post(name: .budgieSessionExpired, object: nil)
            }
            throw error
        }
        return try decode(T.self, from: data)
    }

    /// For endpoints that return `null` bodies on success (get-session).
    static func sendOptional<T: Decodable>(_ req: APIRequest, as type: T.Type) async throws -> T? {
        let (data, response) = try await perform(req)
        captureCookies(from: response)
        let http = response as! HTTPURLResponse
        guard (200...299).contains(http.statusCode) else {
            let error = BudgieError.parse(status: http.statusCode, data: data)
            if http.statusCode == 401 {
                NotificationCenter.default.post(name: .budgieSessionExpired, object: nil)
            }
            throw error
        }
        let trimmed = data.trimmingWhitespace()
        if trimmed == "null" || trimmed.isEmpty { return nil }
        return try decode(T.self, from: data)
    }

    static func sendNoContent(_ req: APIRequest) async throws {
        let (data, response) = try await perform(req)
        captureCookies(from: response)
        let http = response as! HTTPURLResponse
        guard (200...299).contains(http.statusCode) else {
            let error = BudgieError.parse(status: http.statusCode, data: data)
            if http.statusCode == 401 {
                NotificationCenter.default.post(name: .budgieSessionExpired, object: nil)
            }
            throw error
        }
    }

    static func sendPlainText(_ req: APIRequest) async throws -> String {
        let (data, response) = try await perform(req)
        captureCookies(from: response)
        let http = response as! HTTPURLResponse
        guard (200...299).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? ""
            let error: BudgieError
            if http.statusCode == 401 {
                error = .unauthorized(text)
                NotificationCenter.default.post(name: .budgieSessionExpired, object: nil)
            } else {
                error = .server(status: http.statusCode, message: text.isEmpty ? "Something went wrong." : text)
            }
            throw error
        }
        return String(data: data, encoding: .utf8) ?? ""
    }

    // MARK: - Helpers

    private static func perform(_ req: APIRequest) async throws -> (Data, URLResponse) {
        do {
            let request = try makeRequest(req)
            return try await session.data(for: request)
        } catch let error as BudgieError {
            throw error
        } catch {
            throw BudgieError.network(error.localizedDescription)
        }
    }

    private static func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try DateFormatters.decoder.decode(T.self, from: data)
        } catch {
            if let text = String(data: data, encoding: .utf8) {
                throw BudgieError.decoding("Failed to decode \(type): \(text.prefix(200))")
            }
            throw BudgieError.decoding("Failed to decode \(type)")
        }
    }
}

private extension Data {
    func trimmingWhitespace() -> String {
        String(data: self, encoding: .utf8)?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }
}