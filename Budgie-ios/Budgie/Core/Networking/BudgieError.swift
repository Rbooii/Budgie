import Foundation

enum BudgieError: Error, LocalizedError {
    case network(String)
    case unauthorized(String)
    case notFound(String)
    case conflict(String)
    case validation(String)
    case server(status: Int, message: String)
    case decoding(String)
    case unknown

    var errorDescription: String? {
        switch self {
        case .network: return "Connection failed. Check your internet connection."
        case .unauthorized(let m): return m.isEmpty ? "Please sign in again." : m
        case .notFound(let m): return m.isEmpty ? "Not found." : m
        case .conflict(let m): return m
        case .validation(let m): return m
        case .server(_, let m): return m
        case .decoding: return "Something went wrong."
        case .unknown: return "Something went wrong."
        }
    }

    static func parse(status: Int, data: Data) -> BudgieError {
        if status == 401 {
            return .unauthorized(message(from: data))
        }
        if status == 404 {
            return .notFound(message(from: data))
        }
        if status == 409 {
            return .conflict(message(from: data))
        }
        if status == 400 {
            return .validation(message(from: data))
        }
        return .server(status: status, message: message(from: data))
    }

    private static func message(from data: Data) -> String {
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return String(data: data, encoding: .utf8) ?? ""
        }
        if let error = obj["error"] as? String {
            return error
        }
        if obj["success"] as? Bool == false, let errorObj = obj["error"] as? [String: Any] {
            if let issues = errorObj["issues"] as? [[String: Any]] {
                let messages = issues.compactMap { $0["message"] as? String }
                if !messages.isEmpty { return messages.joined(separator: ", ") }
            }
            if let name = errorObj["name"] as? String, name == "ZodError" {
                return "Invalid input."
            }
        }
        return ""
    }
}