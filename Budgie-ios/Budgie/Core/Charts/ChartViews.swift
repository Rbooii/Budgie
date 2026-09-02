import SwiftUI

// MARK: - Cashflow ring (§10.1) — Apple Health-style

struct DonutChart: View {
    var income: Double
    var expense: Double

    private let gap: CGFloat = 2.5 / 360.0
    private let lineWidth: CGFloat = 13
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var incomeTrim: CGFloat = 0
    @State private var expenseTrim: CGFloat = 0

    private var total: Double { income + expense }
    private var incomeFraction: Double { total > 0 ? income / total : 0 }
    private var net: Double { income - expense }

    private var incomeTarget: CGFloat {
        total > 0 ? max(CGFloat(incomeFraction) - gap, 0) : 0
    }

    private var expenseTarget: CGFloat {
        total > 0 ? max(CGFloat(incomeFraction) + gap, 0) : 0
    }

    var body: some View {
        HStack(spacing: 20) {
            ZStack {
                Circle()
                    .stroke(Color.budgieHairlineTrack, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))

                if income > 0 {
                    Circle()
                        .trim(from: 0, to: incomeTrim)
                        .stroke(LinearGradient.incomeArc,
                                style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }
                if expense > 0 {
                    Circle()
                        .trim(from: expenseTrim, to: 1)
                        .stroke(LinearGradient.expenseArc,
                                style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }

                VStack(spacing: 2) {
                    AnimatedNumber(value: net) { animated in
                        if net > 0 { return "+\(formatJuta(abs(animated)))" }
                        if net < 0 { return "-\(formatJuta(abs(animated)))" }
                        return "Rp 0"
                    }
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(net >= 0 ? Color.budgieIncome : Color.budgieExpense)
                    Text("net this month")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.budgieTextTertiary)
                }
            }
            .frame(width: 128, height: 128)
            .onAppear {
                guard !reduceMotion else {
                    incomeTrim = incomeTarget
                    expenseTrim = expenseTarget
                    return
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    withAnimation(.easeOut(duration: 0.7)) {
                        incomeTrim = incomeTarget
                        expenseTrim = expenseTarget
                    }
                }
            }
            .onChange(of: total) { _, _ in
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
            Text(formatRupiahCompact(value))
                .font(.system(size: 13, weight: .semibold))
                .monospacedDigit()
                .foregroundStyle(tint)
        }
    }
}

// MARK: - 12-month asset growth (§10.2)

struct AssetGrowthChart: View {
    var transactions: [Transaction]
    var netWorth: Double

    @State private var selectedMonth: Int?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
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
                    Image(systemName: SFIcons.sparkles)
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
            let totalSpacing = spacing * 11
            let available = geo.size.width - totalSpacing
            let width = min(barWidth, available / 12)
            let trackHeight = geo.size.height - 26

            HStack(alignment: .bottom, spacing: spacing) {
                ForEach(0..<12, id: \.self) { m in
                    let value = d.growth[m]
                    let targetHeight = CGFloat(value / maxValue) * trackHeight
                    let barHeight = m <= currentMonth ? max(targetHeight, m < d.active.count && d.active[m] ? 12 : 6) : 6
                    let color = barColor(m: m, growth: d.growth, active: d.active)
                    let isFuture = m > currentMonth
                    let isSelected = selectedMonth == m

                    VStack(spacing: 4) {
                        if isFuture {
                            Rectangle()
                                .fill(Color.budgieChartPlaceholder.opacity(0.35))
                                .frame(width: width, height: 6)
                                .clipShape(Capsule())
                        } else {
                            Rectangle()
                                .fill(color)
                                .frame(width: width, height: appeared ? barHeight : 0)
                                .clipShape(Capsule())
                                .opacity(isSelected ? 1 : 0.85)
                        }
                        Text(monthLabel(m))
                            .font(.system(size: 9))
                            .foregroundStyle(isFuture || !d.active[m] ? Color.budgieTextFaint : Color.budgieTextSecondary)
                    }
                    .frame(maxHeight: .infinity, alignment: .bottom)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        guard !isFuture else { return }
                        withAnimation(.easeOut(duration: 0.2)) {
                            selectedMonth = selectedMonth == m ? nil : m
                        }
                    }
                    .overlay(alignment: .top) {
                        if isSelected {
                            VStack(spacing: 2) {
                                Text(formatMonthYear(monthDate(m)))
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundStyle(Color.budgieTextSecondary)
                                Text(formatRupiahCompact(value))
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

    private func barColor(m: Int, growth: [Double], active: [Bool]) -> Color {
        if !active[m] { return Color.budgieChartPlaceholder }
        let previous = m == 0 ? data.starting : growth[m - 1]
        let delta = growth[m] - previous
        if abs(delta) < 0.005 { return Color.budgieTransfer }
        return delta > 0 ? Color.budgieBrand : Color.budgieExpense
    }

    private func monthDate(_ m: Int) -> Date {
        let cal = Calendar.current
        let now = Date()
        let year = cal.component(.year, from: now)
        return cal.date(from: DateComponents(year: year, month: m + 1, day: 1)) ?? now
    }

    private func monthLabel(_ m: Int) -> String {
        let names = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
        return names[m]
    }

    private var legend: some View {
        HStack(spacing: 14) {
            legendItem(color: .budgieBrand, label: "Growth")
            legendItem(color: .budgieTransfer, label: "Stable")
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

// MARK: - Spending streams (§10.3)

struct SpendingStreamsChart: View {
    var streams: [(category: String, spent: Double, budget: Budget?)]

    @State private var selected: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Spending Streams")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer()
            }

            VStack(spacing: 0) {
                ForEach(Array(streams.enumerated()), id: \.offset) { index, stream in
                    if index > 0 {
                        Divider().overlay(Color.budgieHairline)
                    }
                    streamRow(stream)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            withAnimation(.easeOut(duration: 0.2)) {
                                selected = selected == stream.category ? nil : stream.category
                            }
                        }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .background(Color.budgieInsetSurface)
            .clipShape(.rect(cornerRadius: 20))

            legend
        }
    }

    private func streamRow(_ stream: (category: String, spent: Double, budget: Budget?)) -> some View {
        VStack(spacing: 8) {
            HStack {
                Text(Categories.label(stream.category))
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer()
                Text(formatRupiahCompact(stream.spent))
                    .font(.system(size: 14, weight: .semibold))
                    .monospacedDigit()
                    .foregroundStyle(stream.spent > (stream.budget?.amount ?? .greatestFiniteMagnitude)
                                     ? Color.budgieExpense : Color.budgieTextPrimary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.budgieHairlineTrack)
                    if let budget = stream.budget {
                        Capsule()
                            .fill(stream.spent > budget.amount ? Color.budgieExpense : Color.budgieExpensePastel)
                            .frame(width: geo.size.width * CGFloat(min(stream.spent / max(budget.amount, 0.01), 1)))
                        Rectangle()
                            .fill(Color.black.opacity(0.4))
                            .frame(width: 2)
                            .offset(x: geo.size.width * CGFloat(min(budget.amount / max(stream.spent, 0.01), 1)) - 1)
                    } else {
                        Capsule()
                            .fill(Color.budgieExpensePastel)
                            .frame(width: geo.size.width)
                    }
                }
            }
            .frame(height: 8)

            if selected == stream.category {
                HStack {
                    Text("Spent \(formatRupiahCompact(stream.spent))")
                    if let budget = stream.budget {
                        let remaining = budget.amount - stream.spent
                        Text("· Budget \(formatRupiahCompact(budget.amount))")
                        Text("· \(remaining >= 0 ? "Remaining " : "Over ")\(formatRupiahCompact(abs(remaining)))")
                            .foregroundStyle(remaining >= 0 ? Color.budgieIncome : Color.budgieExpense)
                    }
                    Spacer()
                }
                .font(.system(size: 11))
                .foregroundStyle(Color.budgieTextSecondary)
                .transition(.opacity)
            }
        }
        .padding(.vertical, 10)
    }

    private var legend: some View {
        HStack(spacing: 14) {
            legendItem(color: .budgieExpensePastel, label: "Spent")
            legendItem(color: .budgieExpense, label: "Over budget")
            legendItem(color: .black.opacity(0.4), label: "Budget limit")
            Spacer()
        }
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 5) {
            RoundedRectangle(cornerRadius: 2)
                .fill(color)
                .frame(width: 14, height: 4)
            Text(label)
                .font(.system(size: 11))
                .foregroundStyle(Color.budgieTextSecondary)
        }
    }
}