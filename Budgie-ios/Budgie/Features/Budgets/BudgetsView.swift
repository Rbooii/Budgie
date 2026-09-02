import SwiftUI

@MainActor
@Observable
final class BudgetsViewModel {
    var budgets: [Budget] = []
    var subscriptions: [Subscription] = []
    var transactions: [Transaction] = []
    var isLoading = true
    var errorMessage: String?

    var monthlyBudgets: [Budget] { budgets.filter { $0.periodDays == 30 } }
    var dailyBudgets: [Budget] { budgets.filter { $0.periodDays == 1 } }
    var otherBudgets: [Budget] { budgets.filter { $0.periodDays != 30 && $0.periodDays != 1 } }

    func spent(_ budget: Budget) -> Double {
        ChartMath.budgetSpent(budget: budget, transactions: transactions)
    }

    func summary(for group: [Budget]) -> (total: Double, spent: Double) {
        let total = group.reduce(0) { $0 + $1.amount }
        let spentTotal = group.reduce(0) { $0 + spent($1) }
        return (total, spentTotal)
    }

    var streams: [(category: String, spent: Double, budget: Budget?)] {
        ChartMath.spendingStreamsWithBudgets(budgets: budgets, transactions: transactions)
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            async let budgetsTask = RESTAPI.budgets()
            async let subsTask = RESTAPI.subscriptions()
            async let txnsTask = RESTAPI.transactions()
            let (budgetsResult, subsResult, txnsResult) = try await (budgetsTask, subsTask, txnsTask)
            budgets = budgetsResult
            subscriptions = subsResult
            transactions = txnsResult
        } catch let error as BudgieError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Something went wrong."
        }
        isLoading = false
    }
}

struct BudgetsView: View {
    @State private var vm = BudgetsViewModel()
    @State private var showAddBudget = false
    @State private var showAddSubscription = false
    @State private var detailBudget: Budget?
    @State private var detailSubscription: Subscription?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if let errorMessage = vm.errorMessage {
                        ErrorBanner(message: errorMessage)
                    }

                    if vm.isLoading {
                        ProgressView().padding(.vertical, 60)
                    } else {
                        summaryCards
                        spendingStreams
                        budgetsList
                        subscriptionsSection
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
            .background(Color(.systemBackground))
            .refreshable { await vm.load() }
            .navigationTitle("Budget")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showAddBudget = true
                    } label: {
                        Image(systemName: SFIcons.plus)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Color.budgieBrand)
                            .frame(width: 34, height: 34)
                            .background(Circle().fill(Color.budgieIncomePastel.opacity(0.4)))
                    }
                }
            }
            .sheet(isPresented: $showAddBudget) {
                AddBudgetWizard(existingCategories: Set(vm.budgets.map(\.category))) {
                    Task { await vm.load() }
                }
                .presentationDetents([.large])
            }
            .sheet(isPresented: $showAddSubscription) {
                AddSubscriptionDialog {
                    Task { await vm.load() }
                }
                .presentationDetents([.large])
            }
            .sheet(item: $detailBudget) { budget in
                BudgetDetailSheet(budget: budget, spent: vm.spent(budget)) {
                    Task { await vm.load() }
                }
                .presentationDetents([.medium, .large])
            }
            .sheet(item: $detailSubscription) { sub in
                SubscriptionDetailSheet(subscription: sub) {
                    Task { await vm.load() }
                }
                .presentationDetents([.medium, .large])
            }
            .task { await vm.load() }
            .onReceive(NotificationCenter.default.publisher(for: .budgieAppDidBecomeActive)) { _ in
                Task { await vm.load() }
            }
        }
    }

    // MARK: Summary cards

    private var summaryCards: some View {
        VStack(spacing: 12) {
            summaryCard(title: "Monthly Budget", budgets: vm.monthlyBudgets)
            summaryCard(title: "Daily Budget", budgets: vm.dailyBudgets)
        }
    }

    private func summaryCard(title: String, budgets: [Budget]) -> some View {
        let summary = vm.summary(for: budgets)
        let remaining = summary.total - summary.spent
        let isOver = remaining < 0

        return GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.budgieTextPrimary)
                    Spacer()
                    Text("\(budgets.count) budget\(budgets.count == 1 ? "" : "s")")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.budgieTextSecondary)
                }
                if budgets.isEmpty {
                    Text("No \(title.lowercased().replacingOccurrences(of: " budget", with: "")) yet")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.budgieTextSecondary)
                        .padding(.vertical, 6)
                } else {
                    Text(formatRupiah(summary.total))
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(Color.budgieTextPrimary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    Text("\(isOver ? "Over budget by" : "Remaining") \(formatRupiahCompact(abs(remaining)))")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(isOver ? Color.budgieExpense : Color.budgieIncome)
                    ProgressTrack(progress: summary.total > 0 ? summary.spent / summary.total : 0, isOver: isOver)
                }
            }
        }
    }

    // MARK: Spending streams

    private var spendingStreams: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("This Month")
            if vm.streams.isEmpty {
                GlassCard {
                    VStack(spacing: 8) {
                        Text("No spending this month yet")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text("Expenses will appear here by category.")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.budgieTextSecondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                GlassCard {
                    SpendingStreamsChart(streams: vm.streams)
                }
            }
        }
    }

    // MARK: Budgets list

    private var budgetsList: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Your Budgets")
            if vm.budgets.isEmpty {
                GlassCard {
                    VStack(spacing: 10) {
                        Text("No budgets yet")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text("Create a budget to keep your spending on track.")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.budgieTextSecondary)
                            .multilineTextAlignment(.center)
                        Button {
                            showAddBudget = true
                        } label: {
                            Text("Add Budget")
                        }
                        .buttonStyle(.budgieSuccess(height: 42))
                        .padding(.top, 2)
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                RowContainer {
                    ForEach(Array(vm.budgets.enumerated()), id: \.element.id) { index, budget in
                        if index > 0 { RowDivider() }
                        BudgetRow(budget: budget, spent: vm.spent(budget)) {
                            detailBudget = budget
                        }
                        .staggeredReveal(index: index)
                    }
                }
            }
        }
    }

    // MARK: Subscriptions

    private var subscriptionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                sectionTitle("Subscriptions")
                Spacer()
                Button {
                    showAddSubscription = true
                } label: {
                    Image(systemName: SFIcons.plus)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.budgieTransfer)
                        .frame(width: 30, height: 30)
                        .background(Circle().fill(Color.budgieTransferPastel.opacity(0.4)))
                }
                .buttonStyle(PlainButtonStyle())
            }
            if vm.subscriptions.isEmpty {
                GlassCard {
                    VStack(spacing: 8) {
                        Text("No subscriptions yet")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text("Track recurring payments like Netflix or Spotify.")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.budgieTextSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                RowContainer {
                    ForEach(Array(vm.subscriptions.enumerated()), id: \.element.id) { index, sub in
                        if index > 0 { RowDivider() }
                        SubscriptionRow(subscription: sub) {
                            detailSubscription = sub
                        }
                        .staggeredReveal(index: index)
                    }
                }
            }
        }
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 20, weight: .semibold))
            .tracking(-0.3)
            .foregroundStyle(Color.budgieTextPrimary)
    }
}

// MARK: - Budget row

struct BudgetRow: View {
    var budget: Budget
    var spent: Double
    var onTap: () -> Void

    private var remaining: Double { budget.amount - spent }
    private var isOver: Bool { remaining < 0 }

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 10) {
                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(Color.budgieExpense.opacity(0.14))
                            .frame(width: 38, height: 38)
                        Circle()
                            .fill(Color.budgieExpense)
                            .frame(width: 9, height: 9)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(Categories.label(budget.category))
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text(periodLabel(budget.periodDays))
                            .font(.system(size: 12))
                            .foregroundStyle(Color.budgieTextSecondary)
                    }
                    Spacer(minLength: 4)
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(formatRupiah(budget.amount))
                            .font(.system(size: 15, weight: .semibold, design: .rounded))
                            .monospacedDigit()
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text("\(formatRupiahCompact(spent)) spent")
                            .font(.system(size: 11))
                            .foregroundStyle(Color.budgieTextTertiary)
                    }
                }
                ProgressTrack(progress: budget.amount > 0 ? spent / budget.amount : 0, isOver: isOver, height: 6)
            }
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Subscription row

struct SubscriptionRow: View {
    var subscription: Subscription
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.budgieTransfer.opacity(0.14))
                        .frame(width: 38, height: 38)
                    Circle()
                        .fill(Color.budgieTransfer)
                        .frame(width: 9, height: 9)
                }
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(subscription.name)
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.budgieTextPrimary)
                            .lineLimit(1)
                        if !subscription.active {
                            Text("Inactive")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(Color.budgieTextSecondary)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 2)
                                .background(Capsule().fill(Color.budgieSurfaceGray))
                        }
                    }
                    Text("\(Categories.label(subscription.category)) · \(periodLabel(subscription.periodDays))")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.budgieTextSecondary)
                        .lineLimit(1)
                    Text("Next \(formatDate(nextBillingDate(subscription.startDate, subscription.periodDays)))")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.budgieTextTertiary)
                }
                Spacer(minLength: 4)
                Text(formatRupiah(subscription.amount))
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(Color.budgieTransfer)
            }
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}