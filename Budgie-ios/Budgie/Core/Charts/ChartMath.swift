//
//  ChartMath.swift
//  Budgie
//
//  Pure computations ported from the web app (§10 of HANDSOFF_IOS.md).
//

import Foundation

enum ChartMath {
    static let currentMonthIndex = Calendar.current.component(.month, from: Date()) - 1

    /// This-month cashflow. Expense includes transfer admin fees.
    static func monthCashflow(transactions: [Transaction], month: Date) -> (income: Double, expense: Double) {
        var income = 0.0
        var expense = 0.0
        for transaction in transactions where isSameMonth(transaction.date, month) {
            switch transaction.type {
            case .income: income += transaction.amount
            case .expense: expense += transaction.amount
            case .transfer: expense += transaction.adminFee
            }
        }
        return (income, expense)
    }

    /// Per-month net effect for a year (income +, expense -, transfer fee -).
    static func monthlyNet(transactions: [Transaction], year: Date) -> [Double] {
        var net = Array(repeating: 0.0, count: 12)
        for transaction in transactions where isSameYear(transaction.date, year) {
            let month = Calendar.current.component(.month, from: transaction.date) - 1
            switch transaction.type {
            case .income: net[month] += transaction.amount
            case .expense: net[month] -= transaction.amount
            case .transfer: net[month] -= transaction.adminFee
            }
        }
        return net
    }

    /// Asset-growth series for the current year + which months have activity.
    static func assetGrowth(transactions: [Transaction], netWorth: Double)
        -> (startingAssets: Double, growth: [Double], activeMonths: [Bool]) {
        let monthly = monthlyNet(transactions: transactions, year: Date())
        let yearNetEffect = monthly.reduce(0, +)
        let startingAssets = netWorth - yearNetEffect

        var growth: [Double] = []
        var cumulative = startingAssets
        for month in 0..<12 {
            cumulative += monthly[month]
            growth.append(cumulative)
        }

        let active = (0..<12).map { month in
            transactions.contains {
                isSameYear($0.date, Date())
                    && Calendar.current.component(.month, from: $0.date) - 1 == month
            }
        }
        return (startingAssets, growth, active)
    }

    /// Amount spent against a budget within its current period.
    static func budgetSpent(budget: Budget, transactions: [Transaction]) -> Double {
        let start = budgetPeriodStart(budget.periodDays)
        return transactions
            .filter { $0.type == .expense && $0.category == budget.category && $0.date >= start }
            .reduce(0) { $0 + $1.amount }
    }

    /// Per-account net change this month (income +, expense -, transfers in/out).
    static func accountNetThisMonth(transactions: [Transaction]) -> [String: Double] {
        var map: [String: Double] = [:]
        for transaction in transactions where isSameMonth(transaction.date, Date()) {
            switch transaction.type {
            case .income:
                if let id = transaction.balanceAccountId { map[id, default: 0] += transaction.amount }
            case .expense:
                if let id = transaction.balanceAccountId { map[id, default: 0] -= transaction.amount }
            case .transfer:
                if let id = transaction.balanceAccountId { map[id, default: 0] -= transaction.amount + transaction.adminFee }
                if let id = transaction.toBalanceAccountId { map[id, default: 0] += transaction.amount }
            }
        }
        return map
    }

    /// Net-worth change vs the end of last month.
    static func netWorthDelta(accounts: [BalanceAccount], transactions: [Transaction]) -> (absolute: Double, pct: Double?) {
        let netWorth = accounts.reduce(0) { $0 + $1.balance }
        let netThisMonth = accountNetThisMonth(transactions: transactions)
        let lastMonthEnd = accounts.reduce(0) { $0 + ($1.balance - (netThisMonth[$1.id] ?? 0)) }
        let absolute = netWorth - lastMonthEnd
        let pct = lastMonthEnd > 0 ? absolute / lastMonthEnd * 100 : nil
        return (absolute, pct)
    }

    /// Today's net change percentage for one account (nil when no activity today).
    static func todayChangePercent(account: BalanceAccount, transactions: [Transaction]) -> Double? {
        let net = transactions
            .filter { ($0.balanceAccountId == account.id || $0.toBalanceAccountId == account.id) && isSameDay($0.date, Date()) }
            .reduce(0.0) { result, transaction in
                switch transaction.type {
                case .income:
                    return result + (transaction.balanceAccountId == account.id ? transaction.amount : 0)
                case .expense:
                    return result - (transaction.balanceAccountId == account.id ? transaction.amount : 0)
                case .transfer:
                    var value = result
                    if transaction.balanceAccountId == account.id { value -= transaction.amount + transaction.adminFee }
                    if transaction.toBalanceAccountId == account.id { value += transaction.amount }
                    return value
                }
            }
        guard net != 0 else { return nil }
        let previous = account.balance - net
        guard previous > 0 else { return nil }
        return net / previous * 100
    }
}
