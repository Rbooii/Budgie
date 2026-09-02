import Foundation

// MARK: - Auth

struct AuthUser: Codable, Identifiable, Hashable {
    var id: String
    var email: String
    var name: String
    var image: String?
    var emailVerified: Bool
    var createdAt: String
    var updatedAt: String
}

struct RawSession: Codable {
    var id: String
    var token: String
    var userId: String
    var expiresAt: String
    var createdAt: String
    var updatedAt: String
    var ipAddress: String?
}

struct SessionInfo: Codable {
    var session: RawSession?
    var user: AuthUser?
}

struct SignInResponse: Codable {
    var redirect: Bool?
    var token: String?
    var url: String?
    var user: AuthUser?
}

struct SignUpResponse: Codable {
    var token: String?
    var user: AuthUser?
}

struct SignOutResponse: Codable {
    var success: Bool?
}

// MARK: - Resources

enum TransactionType: String, Codable, CaseIterable, Sendable {
    case income, expense, transfer
}

struct BalanceAccount: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var balance: Double
    var currency: String
    var type: String
    var userId: String
    var createdAt: String
    var updatedAt: String
}

struct AccountRef: Codable, Hashable {
    var id: String
    var name: String
    var currency: String
}

struct Transaction: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var amount: Double
    var type: TransactionType
    var category: String
    var date: Date
    var adminFee: Double
    var balanceAccountId: String?
    var toBalanceAccountId: String?
    var userId: String
    var createdAt: String
    var updatedAt: String
    var balanceAccount: AccountRef?
    var toBalanceAccount: AccountRef?
}

struct Budget: Codable, Identifiable, Hashable {
    var id: String
    var category: String
    var amount: Double
    var currency: String
    var periodDays: Int
    var userId: String
    var createdAt: String
    var updatedAt: String
}

struct Subscription: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var amount: Double
    var currency: String
    var category: String
    var periodDays: Int
    var startDate: Date
    var active: Bool
    var userId: String
    var createdAt: String
    var updatedAt: String
}

struct PlusStatus: Codable {
    var transactionStatus: String
    var plus: Bool
}

struct CheckoutResult: Codable {
    var orderId: String
    var qrString: String
    var status: String
    var expiresAt: String
}

struct UserStatus: Codable {
    var plus: Bool
}

struct HealthResponse: Codable {
    var status: String
    var timestamp: String
}

// MARK: - Request bodies

struct CreateTransactionBody: Encodable {
    var name: String
    var amount: Double
    var type: TransactionType
    var category: String
    var date: String
    var adminFee: Double = 0
    var balanceAccountId: String
    var toBalanceAccountId: String?

    init(name: String, amount: Double, type: TransactionType, category: String,
         date: Date, adminFee: Double = 0,
         balanceAccountId: String, toBalanceAccountId: String? = nil) {
        self.name = name
        self.amount = amount
        self.type = type
        self.category = category
        self.date = DateFormatters.iso.string(from: date)
        self.adminFee = adminFee
        self.balanceAccountId = balanceAccountId
        self.toBalanceAccountId = toBalanceAccountId
    }
}

struct CreateBudgetBody: Encodable {
    var category: String
    var amount: Double
    var periodDays: Int
}

struct CreateAccountBody: Encodable {
    var name: String
    var balance: Double?
    var currency: String?
    var type: String
}

struct UpdateAccountBody: Encodable {
    var name: String
    var balance: Double
    var currency: String
    var type: String
}

struct UpdateBudgetBody: Encodable {
    var category: String
    var amount: Double
    var periodDays: Int
}

struct CreateSubscriptionBody: Encodable {
    var name: String
    var amount: Double
    var currency: String?
    var category: String
    var periodDays: Int
    var startDate: String
    var active: Bool?

    init(name: String, amount: Double, currency: String? = nil, category: String,
         periodDays: Int, startDate: Date, active: Bool? = nil) {
        self.name = name
        self.amount = amount
        self.currency = currency
        self.category = category
        self.periodDays = periodDays
        self.startDate = DateFormatters.iso.string(from: startDate)
        self.active = active
    }
}

struct PatchUserBody: Encodable {
    var plus: Bool
}

// MARK: - Formatters

enum DateFormatters {
    static let iso: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    static let isoNoFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let raw = try container.decode(String.self)
            if let date = iso.date(from: raw) ?? isoNoFraction.date(from: raw) {
                return date
            }
            throw DecodingError.dataCorruptedError(in: container,
                debugDescription: "Invalid ISO-8601 date: \(raw)")
        }
        return d
    }()

    static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(iso.string(from: date))
        }
        return e
    }()
}

// MARK: - JSON value (for chat tool inputs/outputs)

enum JSONValue: Codable, Hashable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let b = try? container.decode(Bool.self) {
            self = .bool(b)
        } else if let n = try? container.decode(Double.self) {
            self = .number(n)
        } else if let s = try? container.decode(String.self) {
            self = .string(s)
        } else if let a = try? container.decode([JSONValue].self) {
            self = .array(a)
        } else if let o = try? container.decode([String: JSONValue].self) {
            self = .object(o)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unknown JSON value")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null: try container.encodeNil()
        case .bool(let b): try container.encode(b)
        case .number(let n): try container.encode(n)
        case .string(let s): try container.encode(s)
        case .array(let a): try container.encode(a)
        case .object(let o): try container.encode(o)
        }
    }

    var stringValue: String? {
        if case .string(let s) = self { return s }
        return nil
    }

    var numberValue: Double? {
        if case .number(let n) = self { return n }
        return nil
    }

    var objectValue: [String: JSONValue]? {
        if case .object(let o) = self { return o }
        return nil
    }
}