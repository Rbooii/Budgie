import SwiftUI

// MARK: - SF Symbol mapping (§8.6) — port of lucide → SF Symbol

enum SFIcons {
    // Feature tabs
    static let dashboard = "house"
    static let dashboardFill = "house.fill"
    static let transactions = "arrow.right.arrow.left"
    static let budgets = "target"
    static let chat = "message"
    static let profile = "person.crop.circle"

    // Types
    static let income = "arrow.down.left"
    static let expense = "arrow.up.right"
    static let transfer = "arrow.left.arrow.right"

    // Misc
    static let eye = "eye"
    static let eyeSlash = "eye.slash"
    static let trash = "trash"
    static let pencil = "pencil"
    static let plus = "plus"
    static let search = "magnifyingglass"
    static let sparkles = "sparkles"
    static let qr = "qrcode"
    static let pdf = "doc.richtext"
    static let share = "square.and.arrow.up"
    static let wallet = "wallet.pass"
    static let close = "xmark"
    static let chevronLeft = "chevron.left"
    static let chevronRight = "chevron.right"
    static let checkmark = "checkmark"
    static let recurring = "arrow.triangle.2.circlepath"
    static let clock = "clock"

    static func accountIcon(for type: String) -> String {
        switch type.lowercased() {
        case "bank": return "building.columns"
        case "wallet", "cash": return "banknote"
        case "credit": return "creditcard"
        case "investment": return "chart.line.uptrend.xyaxis"
        case "ewallet": return "wallet.pass"
        case "emoney": return "wave.3.right"
        default: return "wallet.pass"
        }
    }

    static func categoryIcon(_ name: String) -> String {
        switch name {
        case "Salary", "Freelance": return "briefcase"
        case "Bonus", "Gift": return "gift"
        case "Investment", "Savings": return "banknote"
        case "Refund": return "arrow.counterclockwise"
        case "OtherIncome", "OtherExpense", "OtherTransfer": return "ellipsis"
        case "FoodAndDrink": return "fork.knife"
        case "Rent": return "house"
        case "Entertainment": return "film"
        case "Transportation": return "car"
        case "Shopping": return "bag"
        case "Utilities": return "bolt"
        case "Healthcare": return "heart.text.square"
        case "Education": return "graduationcap"
        case "Travel": return "airplane"
        case "AccountTransfer": return "arrow.left.arrow.right"
        case "LoanPayment": return "creditcard"
        default: return "ellipsis"
        }
    }
}

// MARK: - Categories (§5.6.3) — enum names on the wire, labels for display.

enum Categories {
    static let income: [String] = ["Salary", "Bonus", "Freelance", "Investment", "Gift", "Refund", "OtherIncome"]
    static let expense: [String] = ["FoodAndDrink", "Rent", "Entertainment", "Transportation", "Shopping",
                                    "Utilities", "Healthcare", "Education", "Travel", "OtherExpense"]
    static let transfer: [String] = ["AccountTransfer", "Savings", "LoanPayment", "OtherTransfer"]

    static func byType(_ type: TransactionType) -> [String] {
        switch type {
        case .income: return income
        case .expense: return expense
        case .transfer: return transfer
        }
    }

    static let all: [String] = income + expense + transfer

    static func label(_ name: String) -> String {
        switch name {
        case "FoodAndDrink": return "Food & Drink"
        case "OtherIncome": return "Other Income"
        case "OtherExpense": return "Other Expense"
        case "AccountTransfer": return "Account Transfer"
        case "LoanPayment": return "Loan Payment"
        case "OtherTransfer": return "Other Transfer"
        default: return name
        }
    }

    static func icon(_ name: String) -> String {
        SFIcons.categoryIcon(name)
    }
}