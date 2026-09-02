import Foundation

// MARK: - Charts math (§10) — port of src/lib/dashboard.ts

enum ChartMath {

    /// §10.1 — This-month cashflow. Expense includes transfer admin fees.
    static func monthCashflow(transactions: [Transaction], month: Date) -> (income: Double, expense: Double) {
        var income = 0.0
        var expense = 0.0
        for t in transactions where isSameMonth(t.date, month) {
            switch t.type {
            case .income: income += t.amount
            case .expense: expense += t.amount
            case .transfer: expense += t.adminFee
            }
        }
        return (income, expense)
    }

    /// §10.2 — per-month net effect for the current year (0..11).
    static func monthlyNet(transactions: [Transaction], year: Date) -> [Double] {
        var net = Array(repeating: 0.0, count: 12)
        for t in transactions where isSameYear(t.date, year) {
            let m = Calendar.current.component(.month, from: t.date) - 1
            switch t.type {
            case .income: net[m] += t.amount
            case .expense: net[m] -= t.amount
            case .transfer: net[m] -= t.adminFee
            }
        }
        return net
    }

    /// §10.2 — asset growth series + active months for the current year.
    static func assetGrowth(transactions: [Transaction], netWorth: Double) -> (startingAssets: Double, growth: [Double], activeMonths: [Bool]) {
        let monthly = monthlyNet(transactions: transactions, year: Date())
        let yearNetEffect = monthly.reduce(0, +)
        let startingAssets = netWorth - yearNetEffect
        var growth: [Double] = []
        var cumulative = startingAssets
        for m in 0..<12 {
            cumulative += monthly[m]
            growth.append(cumulative)
        }
        let active = (0..<12).map { m in
            transactions.contains { isSameYear($0.date, Date()) && Calendar.current.component(.month, from: $0.date) - 1 == m }
        }
        return (startingAssets, growth, active)
    }

    static let currentMonthIndex = Calendar.current.component(.month, from: Date()) - 1

    /// §10.3 — this-month spending per expense category, sorted desc.
    static func spendingStreams(transactions: [Transaction]) -> [(category: String, amount: Double)] {
        var map: [String: Double] = [:]
        for t in transactions where t.type == .expense && isSameMonth(t.date, Date()) {
            map[t.category, default: 0] += t.amount
        }
        return map.sorted { $0.value > $1.value }.map { ($0.key, $0.value) }
    }

    /// §10.4 — per-account net change this month.
    static func accountNetThisMonth(transactions: [Transaction]) -> [String: Double] {
        var map: [String: Double] = [:]
        for t in transactions where isSameMonth(t.date, Date()) {
            switch t.type {
            case .income:
                if let id = t.balanceAccountId { map[id, default: 0] += t.amount }
            case .expense:
                if let id = t.balanceAccountId { map[id, default: 0] -= t.amount }
            case .transfer:
                if let id = t.balanceAccountId { map[id, default: 0] -= (t.amount + t.adminFee) }
                if let id = t.toBalanceAccountId { map[id, default: 0] += t.amount }
            }
        }
        return map
    }

    /// §10.4 — net-worth delta vs last month end.
    static func netWorthDelta(accounts: [BalanceAccount], transactions: [Transaction]) -> (absolute: Double, pct: Double?) {
        let netWorth = accounts.reduce(0) { $0 + $1.balance }
        let netThisMonth = accountNetThisMonth(transactions: transactions)
        let lastMonthEnd = accounts.reduce(0) { $0 + ($1.balance - (netThisMonth[$1.id] ?? 0)) }
        let absolute = netWorth - lastMonthEnd
        let pct = lastMonthEnd > 0 ? absolute / lastMonthEnd * 100 : nil
        return (absolute, pct)
    }

    /// §10.5 — amount spent against a budget (expenses in its period window).
    static func budgetSpent(budget: Budget, transactions: [Transaction]) -> Double {
        let start = budgetPeriodStart(budget.periodDays)
        return transactions
            .filter { $0.type == .expense && $0.category == budget.category && $0.date >= start }
            .reduce(0) { $0 + $1.amount }
    }

    /// Spending streams enriched with budget data (for the budgets screen).
    static func spendingStreamsWithBudgets(budgets: [Budget], transactions: [Transaction]) -> [(category: String, spent: Double, budget: Budget?)] {
        let streams = spendingStreams(transactions: transactions)
        let budgetByCategory = Dictionary(uniqueKeysWithValues: budgets.map { ($0.category, $0) })
        return streams.map { ($0.category, $0.amount, budgetByCategory[$0.category]) }
    }
}