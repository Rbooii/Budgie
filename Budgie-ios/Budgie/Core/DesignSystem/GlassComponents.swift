import SwiftUI

// MARK: - Glass primitives (§8.5) — "Budgie Glass" on iOS 26

// MARK: GlassCard

struct GlassCard<Content: View>: View {
    var radius: CGFloat = 35
    var padding: CGFloat = 16
    var fill: AnyShapeStyle = AnyShapeStyle(.ultraThinMaterial)
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(fill)
            .clipShape(.rect(cornerRadius: radius))
            .overlay {
                RoundedRectangle(cornerRadius: radius)
                    .stroke(Color.budgieHairline, lineWidth: 1)
            }
            .shadow(color: .black.opacity(0.08), radius: 12, x: 0, y: 4)
    }
}

// MARK: GlassTile — small tinted icon tiles (pastel ~35% opacity)

struct GlassTile: View {
    var icon: String
    var tint: Color
    var size: CGFloat = 44
    var iconSize: CGFloat = 17

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size / 2, style: .continuous)
                .fill(tint.opacity(0.32))
            Image(systemName: icon)
                .font(.system(size: iconSize, weight: .semibold))
                .foregroundStyle(tint)
        }
        .frame(width: size, height: size)
    }
}

// MARK: InsetCard — grouped detail rows

struct InsetRow: View {
    var label: String
    var value: String
    var valueColor: Color = .budgieTextPrimary

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(valueColor)
        }
        .padding(.vertical, 10)
    }
}

struct InsetCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(spacing: 0) {
            content
        }
        .padding(.horizontal, 16)
        .background(Color.budgieInsetSurface)
        .clipShape(.rect(cornerRadius: 20))
    }
}

// MARK: ProgressTrack

struct ProgressTrack: View {
    var progress: Double
    var isOver: Bool = false
    var height: CGFloat = 8
    var fillColor: Color? = nil

    private var clamped: Double { min(max(progress, 0), 1) }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.budgieHairlineTrack)
                Capsule()
                    .fill(fillColor ?? (isOver ? Color.budgieExpense : Color.budgieBrand))
                    .frame(width: max(geo.size.width * clamped, height))
            }
        }
        .frame(height: height)
        .animation(.easeOut(duration: 0.3), value: clamped)
    }
}

// MARK: Bottom sheet styling

struct SheetBackgroundModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .presentationBackground(.ultraThinMaterial)
            .presentationCornerRadius(28)
            .presentationDragIndicator(.visible)
    }
}

extension View {
    func budgieSheetBackground() -> some View {
        modifier(SheetBackgroundModifier())
    }
}

// MARK: - Tint helpers

extension TransactionType {
    var strongColor: Color {
        switch self {
        case .income: return .budgieIncome
        case .expense: return .budgieExpense
        case .transfer: return .budgieTransfer
        }
    }

    var pastelColor: Color {
        switch self {
        case .income: return .budgieIncomePastel
        case .expense: return .budgieExpensePastel
        case .transfer: return .budgieTransferPastel
        }
    }

    var iconName: String {
        switch self {
        case .income: return SFIcons.income
        case .expense: return SFIcons.expense
        case .transfer: return SFIcons.transfer
        }
    }

    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - RowContainer — flat inset-grouped list style (Apple Music-like)

struct RowContainer<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(spacing: 0) { content }
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .background(Color.budgieCard)
            .clipShape(.rect(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.budgieHairline, lineWidth: 1))
    }
}

struct RowDivider: View {
    var indent: CGFloat = 52

    var body: some View {
        Divider()
            .overlay(Color.budgieHairline)
            .padding(.leading, indent)
    }
}

// MARK: - Press feedback + reduce-motion helpers

struct PressableScaleModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var scale: CGFloat = 0.98

    func body(content: Content) -> some View {
        content
            .buttonStyle(PlainButtonStyle())
            .scaleEffect(reduceMotion ? 1 : pressScale)
            .contentShape(Rectangle())
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in pressScale = scale }
                    .onEnded { _ in pressScale = 1 }
            )
    }

    @State private var pressScale: CGFloat = 1
}

extension View {
    /// Apply a press-down scale like the web `active:scale-[0.98]`.
    func pressScale(_ scale: CGFloat = 0.98) -> some View {
        modifier(PressableScaleModifier(scale: scale))
    }

    func softShadow() -> some View {
        shadow(color: .black.opacity(0.08), radius: 24, x: 0, y: 4)
    }
}