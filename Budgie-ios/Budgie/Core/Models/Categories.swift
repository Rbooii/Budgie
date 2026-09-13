//
//  Categories.swift
//  Budgie
//
//  Premade category lists + display labels (API uses enum names, never labels).
//

import Foundation

enum Categories {
    static let income = ["Salary", "Bonus", "Freelance", "Investment", "Gift", "Refund", "OtherIncome"]

    static let expense = ["FoodAndDrink", "Rent", "Entertainment", "Transportation", "Shopping",
                          "Utilities", "Healthcare", "Education", "Travel", "OtherExpense"]

    static let transfer = ["AccountTransfer", "Savings", "LoanPayment", "OtherTransfer"]

    static func byType(_ type: TransactionType) -> [String] {
        switch type {
        case .income: return income
        case .expense: return expense
        case .transfer: return transfer
        }
    }

    private static let labels: [String: String] = [
        "FoodAndDrink": "Food & Drink",
        "OtherIncome": "Other Income",
        "OtherExpense": "Other Expense",
        "AccountTransfer": "Account Transfer",
        "LoanPayment": "Loan Payment",
        "OtherTransfer": "Other Transfer"
    ]

    static func label(_ name: String) -> String {
        labels[name] ?? name
    }

    private static let icons: [String: String] = [
        "Salary": "briefcase",
        "Bonus": "gift",
        "Freelance": "briefcase",
        "Investment": "banknote",
        "Gift": "gift",
        "Refund": "arrow.counterclockwise",
        "OtherIncome": "ellipsis",
        "FoodAndDrink": "fork.knife",
        "Rent": "house",
        "Entertainment": "film",
        "Transportation": "car",
        "Shopping": "bag",
        "Utilities": "bolt",
        "Healthcare": "cross.case",
        "Education": "graduationcap",
        "Travel": "airplane",
        "AccountTransfer": "arrow.left.arrow.right",
        "Savings": "creditcard",
        "LoanPayment": "creditcard",
        "OtherTransfer": "ellipsis",
        "OtherExpense": "ellipsis"
    ]

    static func icon(_ name: String) -> String {
        icons[name] ?? "circle"
    }
}
