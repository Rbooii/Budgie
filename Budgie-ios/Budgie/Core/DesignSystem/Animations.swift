import SwiftUI

// MARK: - AnimatedNumber — count-up/down with ease-out (Reduce Motion aware)

struct AnimatedNumber: View {
    var value: Double
    var format: (Double) -> String

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var displayed = 0.0
    @State private var hasAppeared = false

    var body: some View {
        _AnimatedNumberValue(value: displayed, format: format)
            .onAppear {
                guard !hasAppeared else { return }
                hasAppeared = true
                if reduceMotion {
                    displayed = value
                } else {
                    withAnimation(.easeOut(duration: 0.7)) { displayed = value }
                }
            }
            .onChange(of: value) { _, newValue in
                if reduceMotion {
                    displayed = newValue
                } else {
                    withAnimation(.easeOut(duration: 0.5)) { displayed = newValue }
                }
            }
    }
}

private struct _AnimatedNumberValue: Animatable, View {
    var value: Double
    let format: (Double) -> String

    var animatableData: Double {
        get { value }
        set { value = newValue }
    }

    var body: some View {
        Text(format(value))
            .monospacedDigit()
    }
}

// MARK: - StaggeredReveal — fade + rise 200ms, delay per index

struct StaggeredRevealModifier: ViewModifier {
    var index: Int
    var delay: Double = 0.05

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var visible = false

    func body(content: Content) -> some View {
        content
            .opacity(reduceMotion ? 1 : (visible ? 1 : 0))
            .offset(y: reduceMotion ? 0 : (visible ? 0 : 14))
            .onAppear {
                guard !reduceMotion else {
                    visible = true
                    return
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + Double(index) * delay) {
                    withAnimation(.easeOut(duration: 0.25)) { visible = true }
                }
            }
    }
}

extension View {
    func staggeredReveal(index: Int, delay: Double = 0.05) -> some View {
        modifier(StaggeredRevealModifier(index: index, delay: delay))
    }
}

// MARK: - Soft pulse (QRIS waiting, live indicators)

struct SoftPulseModifier: ViewModifier {
    var duration: Double = 1.0

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulsing = false

    func body(content: Content) -> some View {
        content
            .opacity(reduceMotion ? 1 : (pulsing ? 1 : 0.5))
            .onAppear {
                guard !reduceMotion else { return }
                pulsing = true
            }
            .animation(
                reduceMotion ? nil : .easeInOut(duration: duration).repeatForever(autoreverses: true),
                value: pulsing
            )
    }
}

extension View {
    func softPulse(duration: Double = 1.0) -> some View {
        modifier(SoftPulseModifier(duration: duration))
    }
}

// MARK: - Wizard step transition (slide + fade)

extension AnyTransition {
    static var wizardStep: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        )
    }
}