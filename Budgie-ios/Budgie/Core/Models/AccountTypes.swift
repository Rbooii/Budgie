//
//  AccountTypes.swift
//  Budgie
//
//  Display helpers for the free-form account types.
//

import Foundation

enum AccountTypes {
    private static let icons: [String: String] = [
        "bank": "building.columns",
        "wallet": "wallet.pass",
        "ewallet": "wallet.pass",
        "emoney": "wallet.pass",
        "cash": "banknote",
        "credit": "creditcard",
        "investment": "chart.line.uptrend.xyaxis",
        "stocks": "chart.line.uptrend.xyaxis"
    ]

    static func icon(for type: String) -> String {
        icons[type.lowercased()] ?? "wallet.pass"
    }

    static func label(for type: String) -> String {
        type.capitalized
    }
}
