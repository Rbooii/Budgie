//
//  AnimatedNumber.swift
//  Budgie
//
//  Count-up/down to `value` with an ease-out (Reduce Motion aware).
//

import SwiftUI

struct AnimatedNumber: View {
    var value: Double
    var format: (Double) -> String = { formatRupiah($0) }

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var displayed = 0.0
    @State private var hasAppeared = false

    var body: some View {
        AnimatedNumberText(value: displayed, format: format)
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

private struct AnimatedNumberText: Animatable, View {
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

#Preview {
    AnimatedNumber(value: 1_575_513)
        .font(.system(size: 30, weight: .bold))
        .padding()
}
