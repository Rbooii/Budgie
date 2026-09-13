//
//  DonutChart.swift
//  Budgie
//
//  This-month income vs expense ring (§10.1 of HANDSOFF_IOS.md).
//

import SwiftUI

struct DonutChart: View {
    var income: Double
    var expense: Double

    private let gap: CGFloat = 2.5 / 360.0
    private let lineWidth: CGFloat = 13

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var incomeTrim: CGFloat = 0
    @State private var expenseTrim: CGFloat = 0

    private var total: Double { income + expense }
    private var net: Double { income - expense }

    private var incomeFraction: Double {
        total > 0 ? income / total : 0
    }

    private var incomeTarget: CGFloat {
        total > 0 ? max(CGFloat(incomeFraction) - gap, 0) : 0
    }

    private var expenseTarget: CGFloat {
        total > 0 ? max(CGFloat(incomeFraction) + gap, 0) : 0
    }

    private var netLabel: String {
        if net > 0 { return "+\(formatJuta(abs(net)))" }
        if net < 0 { return "-\(formatJuta(abs(net)))" }
        return "Rp 0"
    }

    var body: some View {
        HStack(spacing: 20) {
            ZStack {
                Circle()
                    .stroke(Color.budgieHairlineTrack, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))

                if income > 0 {
                    Circle()
                        .trim(from: 0, to: incomeTrim)
                        .stroke(Color.budgieIncome, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }
                if expense > 0 {
                    Circle()
                        .trim(from: expenseTrim, to: 1)
                        .stroke(Color.budgieExpense, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }

                VStack(spacing: 2) {
                    Text(netLabel)
                        .font(.system(size: 21, weight: .bold))
                        .monospacedDigit()
                        .tracking(-0.4)
                        .foregroundStyle(net >= 0 ? Color.budgieIncome : Color.budgieExpense)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Text("net this month")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.budgieTextTertiary)
                }
                .padding(.horizontal, 22)
            }
            .frame(width: 128, height: 128)
            .onAppear {
                guard !reduceMotion else {
                    incomeTrim = incomeTarget
                    expenseTrim = expenseTarget
                    return
                }
                withAnimation(.easeOut(duration: 0.7)) {
                    incomeTrim = incomeTarget
                    expenseTrim = expenseTarget
                }
            }
            .onChange(of: total) { _, _ in
                withAnimation(.easeOut(duration: 0.7)) {
                    incomeTrim = incomeTarget
                    expenseTrim = expenseTarget
                }
            }

            VStack(spacing: 10) {
                donutRow(label: "Income", value: income, tint: .budgieIncome)
                donutRow(label: "Expense", value: expense, tint: .budgieExpense)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func donutRow(label: String, value: Double, tint: Color) -> some View {
        HStack(spacing: 10) {
            Circle()
                .fill(tint)
                .frame(width: 8, height: 8)
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.budgieTextPrimary)
            Spacer(minLength: 0)
            Text(formatRupiah(value))
                .font(.system(size: 13, weight: .semibold))
                .monospacedDigit()
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
    }
}

#Preview {
    DonutChart(income: 3_600_000, expense: 735_000)
        .padding(16)
        .background(Color.budgieCard, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .padding()
        .background(Color.budgieBackground)
}
