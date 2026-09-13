//
//  BalanceHeroCard.swift
//  Budgie
//

import SwiftUI

struct BalanceHeroCard: View {
    let balance: Double
    let deltaPct: Double?
    let isMasked: Bool
    let onToggleMask: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Text("Balance")
                    .font(.system(size: 15, weight: .semibold))

                Spacer(minLength: 8)

                if let deltaPct {
                    Text("\(signedPercent(deltaPct)) From Last Month")
                        .font(.system(size: 12, weight: .semibold))
                        .monospacedDigit()
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                }

                Button {
                    withAnimation(.easeOut(duration: 0.2)) { onToggleMask() }
                } label: {
                    Image(systemName: isMasked ? "eye.slash" : "eye")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.9))
                        .frame(width: 28, height: 28)
                        .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .layoutPriority(1)
                .contentTransition(.symbolEffect(.replace))
            }
            .foregroundStyle(.white.opacity(0.95))

            Group {
                if isMasked {
                    Text("Rp ••••••")
                        .contentTransition(.opacity)
                } else {
                    AnimatedNumber(value: balance)
                }
            }
            .font(.system(size: 30, weight: .bold))
            .tracking(-0.5)
            .lineLimit(1)
            .minimumScaleFactor(0.6)
            .foregroundStyle(.white)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.budgieBrand, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    }
}

#Preview {
    VStack(spacing: 12) {
        BalanceHeroCard(balance: 1_200_000, deltaPct: 24, isMasked: false) {}
        BalanceHeroCard(balance: 1_200_000, deltaPct: 24, isMasked: true) {}
    }
    .padding()
    .background(Color.budgieBackground)
}
