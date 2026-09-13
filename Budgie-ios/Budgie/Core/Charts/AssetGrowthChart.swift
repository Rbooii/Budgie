//
//  AssetGrowthChart.swift
//  Budgie
//
//  12-month asset growth bars with tap tooltip + YTD pill (§10.2).
//

import SwiftUI

struct AssetGrowthChart: View {
    var transactions: [Transaction]
    var netWorth: Double

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var selectedMonth: Int?
    @State private var appeared = false

    private var data: (starting: Double, growth: [Double], active: [Bool]) {
        let result = ChartMath.assetGrowth(transactions: transactions, netWorth: netWorth)
        return (result.startingAssets, result.growth, result.activeMonths)
    }

    private var currentMonth: Int { ChartMath.currentMonthIndex }

    private var ytd: Double {
        let d = data
        return d.growth[currentMonth] - d.starting
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Asset Growth")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer()
                HStack(spacing: 4) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 10, weight: .bold))
                    Text("YTD")
                        .font(.system(size: 11, weight: .semibold))
                    Text(signedRupiah(ytd))
                        .font(.system(size: 11, weight: .semibold))
                        .monospacedDigit()
                        .foregroundStyle(ytd >= 0 ? Color.budgieIncome : Color.budgieExpense)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(Capsule().fill(Color.budgieSurfaceGray))
            }

            chart
                .frame(height: 120)

            legend
        }
    }

    private var chart: some View {
        GeometryReader { geo in
            let d = data
            let maxValue = max((d.growth + [d.starting]).max() ?? 0, 0.01)
            let barWidth: CGFloat = 16
            let spacing: CGFloat = 8
            let available = geo.size.width - spacing * 11
            let width = min(barWidth, available / 12)
            let trackHeight = geo.size.height - 26

            HStack(alignment: .bottom, spacing: spacing) {
                ForEach(0..<12, id: \.self) { month in
                    let value = d.growth[month]
                    let targetHeight = CGFloat(value / maxValue) * trackHeight
                    let isFuture = month > currentMonth
                    let isActive = d.active[month]
                    let barHeight = isFuture ? 6 : max(targetHeight, isActive ? 12 : 6)
                    let isSelected = selectedMonth == month

                    VStack(spacing: 4) {
                        Rectangle()
                            .fill(isFuture ? Color.budgieChartPlaceholder.opacity(0.35) : barColor(month: month))
                            .frame(width: width, height: appeared ? barHeight : 0)
                            .clipShape(Capsule())
                            .opacity(isSelected ? 1 : 0.85)

                        Text(monthLabel(month))
                            .font(.system(size: 9))
                            .foregroundStyle(isFuture || !isActive ? Color.budgieTextFaint : Color.budgieTextSecondary)
                    }
                    .frame(maxHeight: .infinity, alignment: .bottom)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        guard !isFuture else { return }
                        withAnimation(.easeOut(duration: 0.2)) {
                            selectedMonth = isSelected ? nil : month
                        }
                    }
                    .overlay(alignment: .top) {
                        if isSelected {
                            VStack(spacing: 2) {
                                Text(formatMonthYear(monthDate(month)))
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundStyle(Color.budgieTextSecondary)
                                Text(formatRupiah(value))
                                    .font(.system(size: 10, weight: .bold))
                                    .monospacedDigit()
                                    .foregroundStyle(Color.budgieTextPrimary)
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 5)
                            .background(Color.budgieCard)
                            .clipShape(.rect(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.budgieHairline, lineWidth: 1))
                            .shadow(color: .black.opacity(0.1), radius: 8, y: 2)
                            .offset(y: -30)
                            .fixedSize()
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .onAppear {
                guard !reduceMotion else {
                    appeared = true
                    return
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    withAnimation(.easeOut(duration: 0.6)) { appeared = true }
                }
            }
        }
    }

    private func barColor(month: Int) -> Color {
        let d = data
        guard d.active[month] else { return Color.budgieChartPlaceholder }
        let previous = month == 0 ? d.starting : d.growth[month - 1]
        let delta = d.growth[month] - previous
        if abs(delta) < 0.005 { return Color.budgieStagnant }
        return delta > 0 ? Color.budgieBrand : Color.budgieExpense
    }

    private func monthDate(_ month: Int) -> Date {
        let calendar = Calendar.current
        let year = calendar.component(.year, from: Date())
        return calendar.date(from: DateComponents(year: year, month: month + 1, day: 1)) ?? Date()
    }

    private func monthLabel(_ month: Int) -> String {
        ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][month]
    }

    private var legend: some View {
        HStack(spacing: 14) {
            legendItem(color: .budgieBrand, label: "Growth")
            legendItem(color: .budgieStagnant, label: "Stable")
            legendItem(color: .budgieExpense, label: "Decline")
            Spacer()
        }
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 7, height: 7)
            Text(label)
                .font(.system(size: 11))
                .foregroundStyle(Color.budgieTextSecondary)
        }
    }
}

#Preview {
    AssetGrowthChart(transactions: [], netWorth: 5_000_000)
        .padding(16)
        .background(Color.budgieCard, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .padding()
        .background(Color.budgieBackground)
}
