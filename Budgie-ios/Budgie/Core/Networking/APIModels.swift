//
//  APIModels.swift
//  Budgie
//
//  1:1 with the wire contract in API.md / HANDSOFF_IOS.md §6.
//

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

struct UserStatus: Codable {
    var plus: Bool
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
    var adminFee: Double
    var balanceAccountId: String
    var toBalanceAccountId: String?

    init(name: String, amount: Double, type: TransactionType, category: String,
         date: Date, adminFee: Double = 0,
         balanceAccountId: String, toBalanceAccountId: String? = nil) {
        self.name = name
        self.amount = amount
        self.type = type
        self.category = category
        self.date = JSONCoding.isoString(from: date)
        self.adminFee = adminFee
        self.balanceAccountId = balanceAccountId
        self.toBalanceAccountId = toBalanceAccountId
    }
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

struct CreateBudgetBody: Encodable {
    var category: String
    var amount: Double
    var periodDays: Int
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
        self.startDate = JSONCoding.isoString(from: startDate)
        self.active = active
    }
}

struct PatchUserBody: Encodable {
    var plus: Bool
}
