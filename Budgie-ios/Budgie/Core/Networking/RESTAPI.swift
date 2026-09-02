import Foundation

/// All cookie-authed REST endpoints (base `/api`).
enum RESTAPI {
    // MARK: Health

    static func health() async throws -> HealthResponse {
        try await APIClient.send(APIRequest(path: "/api/health"), as: HealthResponse.self)
    }

    // MARK: User / Plus

    static func userStatus() async throws -> UserStatus {
        try await APIClient.send(APIRequest(path: "/api/user"), as: UserStatus.self)
    }

    static func updateUser(plus: Bool) async throws -> UserStatus {
        try await APIClient.send(
            APIRequest(method: "PATCH", path: "/api/user", body: PatchUserBody(plus: plus)),
            as: UserStatus.self)
    }

    static func checkoutPlus() async throws -> CheckoutResult {
        try await APIClient.send(
            APIRequest(method: "POST", path: "/api/plus/checkout"), as: CheckoutResult.self)
    }

    static func plusStatus(orderId: String) async throws -> PlusStatus {
        try await APIClient.send(
            APIRequest(path: "/api/plus/status/\(orderId)"), as: PlusStatus.self)
    }

    static func simulatePayment(orderId: String) async throws -> PlusStatus {
        try await APIClient.send(
            APIRequest(method: "POST", path: "/api/plus/simulate-payment/\(orderId)"),
            as: PlusStatus.self)
    }

    // MARK: Balance accounts

    static func balanceAccounts() async throws -> [BalanceAccount] {
        try await APIClient.send(APIRequest(path: "/api/balance-accounts"), as: [BalanceAccount].self)
    }

    static func createAccount(name: String, balance: Double?, currency: String?, type: String) async throws -> BalanceAccount {
        let body = CreateAccountBody(name: name, balance: balance, currency: currency, type: type)
        return try await APIClient.send(
            APIRequest(method: "POST", path: "/api/balance-accounts", body: body),
            as: BalanceAccount.self)
    }

    static func updateAccount(id: String, name: String, balance: Double, currency: String, type: String) async throws -> BalanceAccount {
        let body = UpdateAccountBody(name: name, balance: balance, currency: currency, type: type)
        return try await APIClient.send(
            APIRequest(method: "PATCH", path: "/api/balance-accounts/\(id)", body: body),
            as: BalanceAccount.self)
    }

    static func deleteAccount(id: String) async throws {
        try await APIClient.sendNoContent(APIRequest(method: "DELETE", path: "/api/balance-accounts/\(id)"))
    }

    // MARK: Transactions

    static func transactions() async throws -> [Transaction] {
        try await APIClient.send(APIRequest(path: "/api/transactions"), as: [Transaction].self)
    }

    static func createTransaction(_ body: CreateTransactionBody) async throws -> Transaction {
        try await APIClient.send(
            APIRequest(method: "POST", path: "/api/transactions", body: body),
            as: Transaction.self)
    }

    static func deleteTransaction(id: String) async throws {
        try await APIClient.sendNoContent(APIRequest(method: "DELETE", path: "/api/transactions/\(id)"))
    }

    // MARK: Budgets

    static func budgets() async throws -> [Budget] {
        try await APIClient.send(APIRequest(path: "/api/budgets"), as: [Budget].self)
    }

    static func createBudget(category: String, amount: Double, periodDays: Int) async throws -> Budget {
        let body = CreateBudgetBody(category: category, amount: amount, periodDays: periodDays)
        return try await APIClient.send(
            APIRequest(method: "POST", path: "/api/budgets", body: body), as: Budget.self)
    }

    static func updateBudget(id: String, category: String, amount: Double, periodDays: Int) async throws -> Budget {
        let body = UpdateBudgetBody(category: category, amount: amount, periodDays: periodDays)
        return try await APIClient.send(
            APIRequest(method: "PATCH", path: "/api/budgets/\(id)", body: body), as: Budget.self)
    }

    static func deleteBudget(id: String) async throws {
        try await APIClient.sendNoContent(APIRequest(method: "DELETE", path: "/api/budgets/\(id)"))
    }

    // MARK: Subscriptions

    static func subscriptions() async throws -> [Subscription] {
        try await APIClient.send(APIRequest(path: "/api/subscriptions"), as: [Subscription].self)
    }

    static func createSubscription(_ body: CreateSubscriptionBody) async throws -> Subscription {
        try await APIClient.send(
            APIRequest(method: "POST", path: "/api/subscriptions", body: body),
            as: Subscription.self)
    }

    static func deleteSubscription(id: String) async throws {
        try await APIClient.sendNoContent(APIRequest(method: "DELETE", path: "/api/subscriptions/\(id)"))
    }
}