import SwiftUI

// MARK: - Buttons (§8.5): primary / outline / success / soft / softred

struct BudgieButtonStyle: ButtonStyle {
    enum Kind {
        case primary      // black (dark glass)
        case outline      // white + hairline
        case success      // brand green glass
        case soft         // mint
        case softred      // pink
    }

    var kind: Kind
    var height: CGFloat = 46
    var isLoading: Bool = false
    /// When true the button stretches to fill the available width; when false it hugs its content.
    var expanded: Bool = false

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pressed = false

    private var background: some View {
        switch kind {
        case .primary:
            return AnyView(
                RoundedRectangle(cornerRadius: 35, style: .continuous)
                    .fill(Color.budgie(Color(hex: 0x171717), dark: Color.white))
            )
        case .outline:
            return AnyView(
                RoundedRectangle(cornerRadius: 35, style: .continuous)
                    .fill(Color.budgie(Color.white, dark: Color.white.opacity(0.12)))
                    .overlay(
                        RoundedRectangle(cornerRadius: 35, style: .continuous)
                            .stroke(Color.budgieHairlineStrong, lineWidth: 1)
                    )
            )
        case .success:
            return AnyView(
                RoundedRectangle(cornerRadius: 35, style: .continuous)
                    .glassEffect(.regular.tint(Color.budgieBrand), in: .rect(cornerRadius: 35))
            )
        case .soft:
            return AnyView(
                RoundedRectangle(cornerRadius: 35, style: .continuous)
                    .fill(Color.budgieIncomePastel.opacity(0.4))
            )
        case .softred:
            return AnyView(
                RoundedRectangle(cornerRadius: 35, style: .continuous)
                    .fill(Color.budgieExpensePastel.opacity(0.45))
            )
        }
    }

    private var foreground: Color {
        switch kind {
        case .primary: return Color.budgie(Color.white, dark: Color(hex: 0x171717))
        case .outline: return .budgieTextPrimary
        case .success: return .white
        case .soft: return .budgieIncome
        case .softred: return .budgieExpense
        }
    }

    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 8) {
            if isLoading {
                ProgressView()
                    .tint(foreground)
            }
            configuration.label
        }
        .font(.system(size: 16, weight: .semibold))
        .foregroundStyle(foreground)
        .padding(.horizontal, expanded ? 0 : 22)
        .frame(maxWidth: expanded ? .infinity : nil)
        .frame(height: height)
        .background(background)
        .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.98)
        .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == BudgieButtonStyle {
    static func budgiePrimary(height: CGFloat = 46, isLoading: Bool = false, expanded: Bool = false) -> BudgieButtonStyle {
        BudgieButtonStyle(kind: .primary, height: height, isLoading: isLoading, expanded: expanded)
    }
    static func budgieOutline(height: CGFloat = 46, isLoading: Bool = false, expanded: Bool = false) -> BudgieButtonStyle {
        BudgieButtonStyle(kind: .outline, height: height, isLoading: isLoading, expanded: expanded)
    }
    static func budgieSuccess(height: CGFloat = 46, isLoading: Bool = false, expanded: Bool = false) -> BudgieButtonStyle {
        BudgieButtonStyle(kind: .success, height: height, isLoading: isLoading, expanded: expanded)
    }
    static func budgieSoft(height: CGFloat = 46, isLoading: Bool = false, expanded: Bool = false) -> BudgieButtonStyle {
        BudgieButtonStyle(kind: .soft, height: height, isLoading: isLoading, expanded: expanded)
    }
    static func budgieSoftRed(height: CGFloat = 46, isLoading: Bool = false, expanded: Bool = false) -> BudgieButtonStyle {
        BudgieButtonStyle(kind: .softred, height: height, isLoading: isLoading, expanded: expanded)
    }
}

// MARK: - Empty state component

struct EmptyStateView: View {
    var icon: String
    var title: String
    var message: String? = nil
    var tint: Color = .budgieBrand

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle().fill(Color.budgieSurfaceGray)
                Image(systemName: icon)
                    .font(.system(size: 26, weight: .medium))
                    .foregroundStyle(tint)
            }
            .frame(width: 88, height: 88)
            Text(title)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)
            if let message {
                Text(message)
                    .font(.system(size: 14))
                    .foregroundStyle(Color.budgieTextSecondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
    }
}

// MARK: - Error banner

struct ErrorBanner: View {
    var message: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 13, weight: .semibold))
            Text(message)
                .font(.system(size: 13, weight: .medium))
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(Color.budgieExpense)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.budgieExpensePastel.opacity(0.45))
        .clipShape(.rect(cornerRadius: 20))
    }
}