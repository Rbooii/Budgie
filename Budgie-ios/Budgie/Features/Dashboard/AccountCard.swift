//
//  AccountCard.swift
//  Budgie
//

import SwiftUI

struct AccountCard: View {
    let account: BalanceAccount
    let transactions: [Transaction]
    var isMasked = false
    var onTap: () -> Void = {}

    private var lineColor: Color {
        switch SparklineMath.trend(for: series) {
        case .up: return .budgieBrand
        case .down: return .budgieExpense
        case .flat: return .budgieStagnant
        }
    }

    private var series: [Double] {
        SparklineMath.series(for: account, transactions: transactions)
    }

    private var todayChange: Double? {
        guard ["investment", "stocks"].contains(account.type.lowercased()) else { return nil }
        return ChartMath.todayChangePercent(account: account, transactions: transactions)
    }

    var body: some View {
        Button(action: onTap) {
            content
        }
        .buttonStyle(PressableButtonStyle())
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Text(account.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                    .lineLimit(1)
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.budgieTextFaint)
            }

            Sparkline(values: series, color: lineColor)
                .frame(height: 44)

            VStack(alignment: .leading, spacing: 3) {
                Group {
                    if isMasked {
                        Text("Rp ••••••")
                            .contentTransition(.opacity)
                    } else {
                        AnimatedNumber(value: account.balance)
                    }
                }
                .font(.system(size: 17, weight: .bold))
                .tracking(-0.3)
                .foregroundStyle(Color.budgieTextPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

                if let todayChange {
                    Text("\(todayChange <= 0 ? "\u{2193}" : "\u{2191}") \(signedPercent(todayChange).dropFirst()) today")
                        .font(.system(size: 12, weight: .medium))
                        .monospacedDigit()
                        .foregroundStyle(Color.budgieTextSecondary)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .budgieCard()
    }
}

#Preview {
    HStack(spacing: 12) {
        AccountCard(
            account: BalanceAccount(id: "1", name: "BCA", balance: 2_500_000, currency: "IDR",
                                    type: "bank", userId: "u", createdAt: "", updatedAt: ""),
            transactions: []
        )
        AccountCard(
            account: BalanceAccount(id: "2", name: "Stocks", balance: 5_000_000, currency: "IDR",
                                    type: "investment", userId: "u", createdAt: "", updatedAt: ""),
            transactions: []
        )
    }
    .padding()
    .background(Color.budgieBackground)
}
