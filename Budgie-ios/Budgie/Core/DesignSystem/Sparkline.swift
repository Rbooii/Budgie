//
//  Sparkline.swift
//  Budgie
//
//  Mini balance-history line for account cards. The series is reconstructed
//  backwards from the account's current balance using its transactions.
//

import SwiftUI

enum SparklineTrend {
    case up, down, flat
}

enum SparklineMath {
    /// Overall direction of the series (last vs first), with a small relative
    /// threshold so tiny changes count as stagnant.
    static func trend(for values: [Double]) -> SparklineTrend {
        guard let first = values.first, let last = values.last else { return .flat }
        let delta = last - first
        let threshold = max(abs(first) * 0.001, 1)
        if abs(delta) < threshold { return .flat }
        return delta > 0 ? .up : .down
    }

    static func series(for account: BalanceAccount, transactions: [Transaction], maxPoints: Int = 24) -> [Double] {
        let relevant = transactions
            .filter { $0.balanceAccountId == account.id || $0.toBalanceAccountId == account.id }
            .sorted { $0.date < $1.date }
        guard !relevant.isEmpty else { return [] }

        func delta(_ transaction: Transaction) -> Double {
            switch transaction.type {
            case .income:
                return transaction.balanceAccountId == account.id ? transaction.amount : 0
            case .expense:
                return transaction.balanceAccountId == account.id ? -transaction.amount : 0
            case .transfer:
                var value = 0.0
                if transaction.balanceAccountId == account.id { value -= transaction.amount + transaction.adminFee }
                if transaction.toBalanceAccountId == account.id { value += transaction.amount }
                return value
            }
        }

        let total = relevant.reduce(0) { $0 + delta($1) }
        var running = account.balance - total
        var values: [Double] = [running]
        for transaction in relevant {
            running += delta(transaction)
            values.append(running)
        }

        guard values.count > maxPoints else { return values }
        let step = Double(values.count - 1) / Double(maxPoints - 1)
        return (0..<maxPoints).map { values[Int((Double($0) * step).rounded())] }
    }
}

struct Sparkline: View {
    var values: [Double]
    var color: Color
    var lineWidth: CGFloat = 2.5

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var progress: CGFloat = 0

    var body: some View {
        GeometryReader { geo in
            let points = normalizedPoints(in: geo.size)
            if points.count > 1 {
                Path { path in
                    path.move(to: points[0])
                    for point in points.dropFirst() { path.addLine(to: point) }
                }
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
            } else {
                Path { path in
                    let y = geo.size.height * 0.6
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: geo.size.width, y: y))
                }
                .trim(from: 0, to: progress)
                .stroke(color.opacity(0.3), style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, dash: [4, 5]))
            }
        }
        .onAppear { animateIn() }
        .onChange(of: values) { _, _ in animateIn() }
    }

    private func animateIn() {
        guard !reduceMotion else {
            progress = 1
            return
        }
        progress = 0
        DispatchQueue.main.async {
            withAnimation(.easeOut(duration: 0.9)) { progress = 1 }
        }
    }

    private func normalizedPoints(in size: CGSize) -> [CGPoint] {
        guard values.count > 1 else { return [] }
        let minValue = values.min() ?? 0
        let maxValue = values.max() ?? 0
        let range = maxValue - minValue
        let inset = lineWidth
        let width = max(size.width - inset * 2, 1)
        let height = max(size.height - inset * 2, 1)

        return values.enumerated().map { index, value in
            let x = inset + width * CGFloat(index) / CGFloat(values.count - 1)
            let normalized = range == 0 ? 0.5 : (value - minValue) / range
            let y = inset + height * (1 - CGFloat(normalized))
            return CGPoint(x: x, y: y)
        }
    }
}

#Preview {
    Sparkline(values: [10, 14, 9, 18, 22, 16, 26, 30], color: .budgieBrand)
        .frame(width: 160, height: 44)
        .padding()
}
