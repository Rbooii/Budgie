//
//  TransactionTypeStyle.swift
//  Budgie
//

import SwiftUI

extension TransactionType {
    var displayName: String {
        switch self {
        case .income: return "Income"
        case .expense: return "Expense"
        case .transfer: return "Transfer"
        }
    }

    var strongColor: Color {
        switch self {
        case .income: return .budgieIncome
        case .expense: return .budgieExpense
        case .transfer: return .budgieTransfer
        }
    }

    var iconName: String {
        switch self {
        case .income: return "arrow.down.left"
        case .expense: return "arrow.up.right"
        case .transfer: return "arrow.left.arrow.right"
        }
    }
}
