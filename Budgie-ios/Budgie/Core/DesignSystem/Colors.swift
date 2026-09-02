import SwiftUI

// MARK: - Budgie palette (§8.1) — never invent new hues; dark mode only swaps surfaces.

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

    init(hexString: String) {
        let cleaned = hexString.replacingOccurrences(of: "#", with: "")
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)
        self.init(hex: UInt32(value))
    }

    /// Adaptive color: same semantic hue in light & dark; only surface brightness changes.
    static func budgie(_ light: Color, dark: Color) -> Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
}

extension Color {
    // Brand
    static let budgieBrand = Color(hex: 0x00C610)
    static let budgieBrandPressed = Color(hex: 0x00B609)
    static let budgieSignInGreen = Color(hex: 0x00CE11)

    // Semantic strong tints
    static let budgieIncome = Color(hex: 0x1F9B29)
    static let budgieExpense = Color(hex: 0xD8000C)
    static let budgieTransfer = Color(hex: 0xB25B00)

    // Semantic pastels
    static let budgieIncomePastel = Color(hex: 0xA0FFA8)
    static let budgieExpensePastel = Color(hex: 0xFFBABA)
    static let budgieTransferPastel = Color(hex: 0xFFD9A0)

    // Surfaces (adaptive)
    static let budgieSurfaceGray = Color.budgie(Color(hex: 0xF2F2F2), dark: Color.white.opacity(0.10))
    static let budgieInsetSurface = Color.budgie(Color(hex: 0xFAFAFA), dark: Color.white.opacity(0.07))
    static let budgieLandingGray = Color.budgie(Color(hex: 0xF9F9F8), dark: Color.white.opacity(0.05))
    static let budgieChartPlaceholder = Color.budgie(Color(hex: 0xE5E5E5), dark: Color.white.opacity(0.14))
    static let budgieCard = Color.budgie(.white, dark: Color(red: 0.11, green: 0.115, blue: 0.13))

    // Text ramp
    static let budgieTextPrimary = Color.budgie(Color(hex: 0x171717), dark: Color.white)
    static let budgieTextSecondary = Color.budgie(Color.black.opacity(0.45), dark: Color.white.opacity(0.55))
    static let budgieTextTertiary = Color.budgie(Color.black.opacity(0.35), dark: Color.white.opacity(0.45))
    static let budgieTextFaint = Color.budgie(Color.black.opacity(0.25), dark: Color.white.opacity(0.35))

    // Hairlines
    static let budgieHairline = Color.budgie(Color.black.opacity(0.06), dark: Color.white.opacity(0.12))
    static let budgieHairlineStrong = Color.budgie(Color.black.opacity(0.10), dark: Color.white.opacity(0.18))
    static let budgieHairlineTrack = Color.budgie(Color.black.opacity(0.06), dark: Color.white.opacity(0.14))

    static let budgieGrabber = Color.budgie(Color.black.opacity(0.10), dark: Color.white.opacity(0.20))
}

// Donut chart gradients (§10.1)
extension LinearGradient {
    static let incomeArc = LinearGradient(colors: [Color(hex: 0x00C610), Color(hex: 0x00B609)],
                                          startPoint: .leading, endPoint: .trailing)
    static let expenseArc = LinearGradient(colors: [Color(hex: 0xE0584F), Color(hex: 0xC4453B)],
                                           startPoint: .leading, endPoint: .trailing)
}

// MARK: - User chat bubble fill

extension Color {
    static let budgieChatBubble = Color.budgie(Color(hex: 0xF2F2F2), dark: Color.white.opacity(0.12))
}