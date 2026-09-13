//
//  BudgetsView.swift
//  Budgie
//

import SwiftUI

struct BudgetsView: View {
    @State private var vm = BudgetsViewModel()
    @State private var showAddBudget = false
    @State private var detailBudget: Budget?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                if let errorMessage = vm.errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                if vm.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 60)
                } else if vm.budgets.isEmpty {
                    emptyState
                } else {
                    if let hero = vm.heroGroup {
                        summaryHero(title: hero.title, budgets: hero.budgets)
                    }
                    budgetsList
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(Color.budgieBackground)
        .refreshable { await vm.load() }
        .task { await vm.load() }
        .onAppear {
            #if DEBUG
            if DebugSeed.flow == "budget", !showAddBudget {
                showAddBudget = true
            }
            #endif
        }
        .fullScreenCover(isPresented: $showAddBudget) {
            AddBudgetView(existingCategories: Set(vm.budgets.map(\.category))) {
                Task { await vm.load() }
            }
        }
        .sheet(item: $detailBudget) { budget in
            BudgetDetailSheet(budget: budget, spent: vm.spent(budget)) {
                Task { await vm.load() }
            }
            .presentationDetents([.medium, .large])
        }
    }

    // MARK: - Header

    private var header: some View {
        ZStack {
            Text("Budget")
                .font(.system(size: 26, weight: .semibold))
                .tracking(-0.4)
                .foregroundStyle(Color.budgieTextPrimary)

            HStack(spacing: 8) {
                Spacer()
                Button {
                    showAddBudget = true
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.budgieBrand)
                        .frame(width: 34, height: 34)
                        .background(Circle().fill(Color.budgieBrand.opacity(0.12)))
                }
                .buttonStyle(PressableButtonStyle())
            }
        }
    }

    // MARK: - Hero

    private func summaryHero(title: String, budgets: [Budget]) -> some View {
        let summary = vm.summary(budgets)
        let remaining = summary.limit - summary.spent
        let isOver = remaining < 0

        return VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                Spacer()
                Text("\(budgets.count) budget\(budgets.count == 1 ? "" : "s")")
                    .font(.system(size: 12, weight: .semibold))
                    .monospacedDigit()
            }
            .foregroundStyle(.white.opacity(0.95))

            VStack(alignment: .leading, spacing: 4) {
                Text(formatRupiah(abs(remaining)))
                    .font(.system(size: 30, weight: .bold))
                    .monospacedDigit()
                    .tracking(-0.5)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                Text(isOver ? "Over budget" : "Left to spend")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.85))
            }

            ProgressTrack(
                progress: summary.limit > 0 ? summary.spent / summary.limit : 0,
                height: 6,
                trackColor: .white.opacity(0.25),
                fillColor: .white
            )

            Text("\(formatRupiah(summary.spent)) spent of \(formatRupiah(summary.limit))")
                .font(.system(size: 12))
                .monospacedDigit()
                .foregroundStyle(.white.opacity(0.85))
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .foregroundStyle(.white)
        .background(
            isOver ? Color.budgieExpense : Color.budgieBrand,
            in: RoundedRectangle(cornerRadius: 24, style: .continuous)
        )
    }

    // MARK: - List

    private var budgetsList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Your budgets")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)

            ForEach(vm.budgets) { budget in
                Button {
                    detailBudget = budget
                } label: {
                    BudgetCard(budget: budget, spent: vm.spent(budget))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "chart.pie")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(Color.budgieBrand)
                .padding(.bottom, 4)
            Text("No budgets yet")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)
            Text("Set a limit per category to keep your spending on track.")
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
                .multilineTextAlignment(.center)
            CapsuleButton(title: "Add Budget") {
                showAddBudget = true
            }
            .padding(.top, 12)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .padding(.horizontal, 16)
        .budgieCard()
    }
}

// MARK: - Budget card

struct BudgetCard: View {
    let budget: Budget
    let spent: Double

    private var remaining: Double { budget.amount - spent }
    private var isOver: Bool { remaining < 0 }

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.budgieExpense.opacity(0.12))
                        .frame(width: 38, height: 38)
                    Image(systemName: Categories.icon(budget.category))
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Color.budgieExpense)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(Categories.label(budget.category))
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.budgieTextPrimary)
                        .lineLimit(1)
                    Text(periodLabel(budget.periodDays))
                        .font(.system(size: 12))
                        .foregroundStyle(Color.budgieTextSecondary)
                }

                Spacer(minLength: 8)

                VStack(alignment: .trailing, spacing: 2) {
                    Text(formatRupiah(budget.amount))
                        .font(.system(size: 15, weight: .semibold))
                        .monospacedDigit()
                        .tracking(-0.3)
                        .foregroundStyle(Color.budgieTextPrimary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(isOver ? "Over \(formatRupiah(abs(remaining)))" : "\(formatRupiah(remaining)) left")
                        .font(.system(size: 11, weight: .medium))
                        .monospacedDigit()
                        .foregroundStyle(isOver ? Color.budgieExpense : Color.budgieTextTertiary)
                        .lineLimit(1)
                }
            }

            ProgressTrack(
                progress: budget.amount > 0 ? spent / budget.amount : 0,
                isOver: isOver,
                height: 6
            )
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .budgieCard()
    }
}

#Preview {
    BudgetsView()
}
