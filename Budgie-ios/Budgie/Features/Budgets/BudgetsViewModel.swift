//
//  BudgetsViewModel.swift
//  Budgie
//

import SwiftUI

@MainActor
@Observable
final class BudgetsViewModel {
    var budgets: [Budget] = []
    var transactions: [Transaction] = []
    var isLoading = true
    var errorMessage: String?

    var monthly: [Budget] {
        budgets.filter { $0.periodDays == 30 }
    }

    var daily: [Budget] {
        budgets.filter { $0.periodDays == 1 }
    }

    /// Monthly summary when present, otherwise daily (used by the hero card).
    var heroGroup: (title: String, budgets: [Budget])? {
        if !monthly.isEmpty { return ("Monthly budget", monthly) }
        if !daily.isEmpty { return ("Daily budget", daily) }
        return nil
    }

    func spent(_ budget: Budget) -> Double {
        ChartMath.budgetSpent(budget: budget, transactions: transactions)
    }

    func summary(_ group: [Budget]) -> (limit: Double, spent: Double) {
        let limit = group.reduce(0) { $0 + $1.amount }
        let spent = group.reduce(0) { $0 + self.spent($1) }
        return (limit, spent)
    }

    func load() async {
        errorMessage = nil
        do {
            async let budgetsRequest = RESTAPI.budgets()
            async let transactionsRequest = RESTAPI.transactions()
            let (budgets, transactions) = try await (budgetsRequest, transactionsRequest)
            self.budgets = budgets
            self.transactions = transactions
        } catch let error as BudgieError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Something went wrong."
        }
        isLoading = false
    }
}
