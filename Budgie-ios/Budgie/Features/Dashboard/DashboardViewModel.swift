//
//  DashboardViewModel.swift
//  Budgie
//

import SwiftUI

@MainActor
@Observable
final class DashboardViewModel {
    var accounts: [BalanceAccount] = []
    var transactions: [Transaction] = []
    var isLoading = true
    var errorMessage: String?

    var netWorth: Double {
        accounts.reduce(0) { $0 + $1.balance }
    }

    var delta: (absolute: Double, pct: Double?) {
        ChartMath.netWorthDelta(accounts: accounts, transactions: transactions)
    }

    var hasInsight: Bool {
        transactions.contains { isSameYear($0.date, Date()) }
    }

    var monthFlow: (income: Double, expense: Double) {
        ChartMath.monthCashflow(transactions: transactions, month: Date())
    }

    func load() async {
        errorMessage = nil
        do {
            async let accountsRequest = RESTAPI.balanceAccounts()
            async let transactionsRequest = RESTAPI.transactions()
            let (accounts, transactions) = try await (accountsRequest, transactionsRequest)
            self.accounts = accounts.sorted { $0.createdAt < $1.createdAt }
            self.transactions = transactions
        } catch let error as BudgieError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Something went wrong."
        }
        isLoading = false
    }
}
