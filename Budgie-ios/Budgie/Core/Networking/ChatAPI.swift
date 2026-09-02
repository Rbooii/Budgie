import Foundation

// MARK: - SSE chunk union (AI SDK v7 UI message stream)

struct ChatChunk: Decodable {
    var type: String
    var messageId: String?
    var id: String?
    var delta: String?
    var toolCallId: String?
    var toolName: String?
    var title: String?
    var input: JSONValue?
    var inputTextDelta: String?
    var output: JSONValue?
    var errorText: String?
    var finishReason: String?
    var reason: String?
}

// MARK: - Chat request/response

struct ChatRequestBody: Encodable {
    var id: String
    var messages: [UIMessage]
    var trigger = "submit-message"
    var model: String
}

// MARK: - UIMessage / parts (local chat state)

struct UIMessage: Codable, Identifiable, Hashable {
    var id: String
    var role: String
    var parts: [UIPart]

    var textContent: String {
        parts.compactMap { part in
            if case .text(_, let text, _) = part { return text }
            return nil
        }.joined()
    }
}

enum UIPart: Codable, Hashable {
    case text(id: String?, text: String, state: String?)
    case reasoning(id: String?, text: String, state: String?)
    case tool(name: String, callId: String, state: String, input: JSONValue?, output: JSONValue?, errorText: String?)

    private enum CodingKeys: String, CodingKey {
        case type, id, text, state, name, callId, input, output, errorText
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let type = try c.decode(String.self, forKey: .type)
        switch type {
        case "text":
            self = .text(id: try c.decodeIfPresent(String.self, forKey: .id),
                         text: try c.decodeIfPresent(String.self, forKey: .text) ?? "",
                         state: try c.decodeIfPresent(String.self, forKey: .state))
        case "reasoning":
            self = .reasoning(id: try c.decodeIfPresent(String.self, forKey: .id),
                              text: try c.decodeIfPresent(String.self, forKey: .text) ?? "",
                              state: try c.decodeIfPresent(String.self, forKey: .state))
        case "tool":
            self = .tool(name: try c.decode(String.self, forKey: .name),
                         callId: try c.decode(String.self, forKey: .callId),
                         state: try c.decode(String.self, forKey: .state),
                         input: try c.decodeIfPresent(JSONValue.self, forKey: .input),
                         output: try c.decodeIfPresent(JSONValue.self, forKey: .output),
                         errorText: try c.decodeIfPresent(String.self, forKey: .errorText))
        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: c, debugDescription: "Unknown part type \(type)")
        }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .text(let id, let text, let state):
            try c.encode("text", forKey: .type)
            try c.encodeIfPresent(id, forKey: .id)
            try c.encode(text, forKey: .text)
            try c.encodeIfPresent(state, forKey: .state)
        case .reasoning(let id, let text, let state):
            try c.encode("reasoning", forKey: .type)
            try c.encodeIfPresent(id, forKey: .id)
            try c.encode(text, forKey: .text)
            try c.encodeIfPresent(state, forKey: .state)
        case .tool(let name, let callId, let state, let input, let output, let errorText):
            try c.encode("tool", forKey: .type)
            try c.encode(name, forKey: .name)
            try c.encode(callId, forKey: .callId)
            try c.encode(state, forKey: .state)
            try c.encodeIfPresent(input, forKey: .input)
            try c.encodeIfPresent(output, forKey: .output)
            try c.encodeIfPresent(errorText, forKey: .errorText)
        }
    }
}

// MARK: - SSE client

enum ChatAPI {
    static let models: [String] = ["gemini-2.5-flash", "gemini-3.5-flash-lite"]

    static func modelLabel(_ model: String) -> String {
        switch model {
        case "gemini-2.5-flash": return "Gemini 2.5 Flash"
        case "gemini-3.5-flash-lite": return "Gemini 3.5 Flash Lite"
        default: return model
        }
    }

    static func isRateLimitError(_ text: String) -> Bool {
        let lower = text.lowercased()
        return lower.contains("429")
            || lower.contains("quota")
            || lower.contains("resource_exhausted")
            || lower.contains("rate limit")
    }

    static func stream(messages: [UIMessage], model: String, chatId: String) -> AsyncThrowingStream<ChatChunk, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    var request = URLRequest(url: APIClient.baseURL.appendingPathComponent("api/chat"))
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    if let pair = SessionCookieBox.shared.pair {
                        request.setValue("\(pair.name)=\(pair.value)", forHTTPHeaderField: "Cookie")
                    }
                    let body = ChatRequestBody(id: chatId, messages: messages, model: model)
                    request.httpBody = try DateFormatters.encoder.encode(body)

                    let (bytes, response) = try await URLSession.shared.bytes(for: request)
                    guard let http = response as? HTTPURLResponse else {
                        throw BudgieError.unknown
                    }
                    if let setCookie = http.value(forHTTPHeaderField: "Set-Cookie"),
                       let eq = setCookie.firstIndex(of: "="),
                       String(setCookie[..<eq]).contains("session_token") {
                        let name = String(setCookie[..<eq])
                        let value = String(setCookie[setCookie.index(after: eq)...])
                            .split(separator: ";").first.map(String.init) ?? ""
                        SessionCookieBox.shared.pair = CookiePair(name: name, value: value)
                        NotificationCenter.default.post(name: .budgieCookieUpdated, object: nil)
                    }
                    guard (200...299).contains(http.statusCode) else {
                        let raw = try await bytes.reduce(into: [UInt8]()) { $0.append($1) }
                        let text = String(bytes: raw, encoding: .utf8) ?? ""
                        if http.statusCode == 401 {
                            NotificationCenter.default.post(name: .budgieSessionExpired, object: nil)
                            throw BudgieError.unauthorized(text.isEmpty ? "Unauthorized" : text)
                        }
                        throw BudgieError.server(status: http.statusCode, message: text.isEmpty ? "Bad request" : text)
                    }

                    for try await line in bytes.lines {
                        guard line.hasPrefix("data:") else { continue }
                        let payload = line.dropFirst(5).trimmingCharacters(in: .whitespaces)
                        if payload == "[DONE]" { break }
                        guard let data = payload.data(using: .utf8) else { continue }
                        let chunk = try DateFormatters.decoder.decode(ChatChunk.self, from: data)
                        continuation.yield(chunk)
                    }
                    continuation.finish()
                } catch {
                    if error is CancellationError {
                        continuation.finish()
                    } else {
                        continuation.finish(throwing: error)
                    }
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }
}