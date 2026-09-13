//
//  Colors.swift
//  Budgie
//
//  Design tokens sampled from the approved mockups (home.png, Transactions.png),
//  adaptive across light and dark appearances.
//

import SwiftUI
import UIKit

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }

    /// Same semantic hue in both schemes — only surfaces/brightness adapt.
    static func budgie(_ light: Color, dark: Color) -> Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
}

extension Color {
    // Brand & semantic
    static let budgieBrand = Color(hex: 0x39CD6B)
    static let budgieIncome = Color.budgie(Color(hex: 0x39CD6B), dark: Color(hex: 0x3DDC74))
    static let budgieExpense = Color.budgie(Color(hex: 0xFF2600), dark: Color(hex: 0xFF5A4D))
    static let budgieTransfer = Color.budgie(Color(hex: 0xFF9F33), dark: Color(hex: 0xFFB454))
    static let budgieStagnant = Color.budgie(Color(hex: 0xB0B0B0), dark: Color(hex: 0x8E8E93))

    // Surfaces
    static let budgieBackground = Color.budgie(Color(hex: 0xF7F7F7), dark: Color(hex: 0x101014))
    static let budgieScreen = Color.budgie(.white, dark: Color(hex: 0x101014))
    static let budgieCard = Color.budgie(.white, dark: Color(hex: 0x1C1C1E))
    static let budgieSurfaceGray = Color.budgie(Color(hex: 0xF2F2F2), dark: Color.white.opacity(0.10))
    static let budgieChatBackground = Color.budgie(Color(hex: 0xFCFAF7), dark: Color(hex: 0x16151A))
    static let budgieInk = Color.budgie(Color(hex: 0x3D3D3D), dark: Color(hex: 0xF2F2F2))
    static let budgieInkContrast = Color.budgie(.white, dark: Color(hex: 0x171717))
    static let budgieChip = Color.budgie(Color.black.opacity(0.06), dark: Color.white.opacity(0.12))

    // Text
    static let budgieTextPrimary = Color.budgie(Color(hex: 0x171717), dark: .white)
    static let budgieTextSecondary = Color.budgie(Color.black.opacity(0.45), dark: Color.white.opacity(0.55))
    static let budgieTextTertiary = Color.budgie(Color.black.opacity(0.35), dark: Color.white.opacity(0.45))
    static let budgieTextFaint = Color.budgie(Color.black.opacity(0.25), dark: Color.white.opacity(0.35))

    // Lines & charts
    static let budgieHairline = Color.budgie(Color.black.opacity(0.06), dark: Color.white.opacity(0.12))
    static let budgieHairlineTrack = Color.budgie(Color.black.opacity(0.06), dark: Color.white.opacity(0.16))
    static let budgieChartPlaceholder = Color.budgie(Color(hex: 0xE5E5E5), dark: Color.white.opacity(0.16))
    static let budgieShadow = Color.black.opacity(0.08)
}
