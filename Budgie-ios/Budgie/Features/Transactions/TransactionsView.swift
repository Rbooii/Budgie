import SwiftUI

@MainActor
@Observable
final class TransactionsViewModel {
    var transactions: [Transaction] = []
    var accounts: [BalanceAccount] = []
    var isLoading = true
    var errorMessage: String?
    var searchText = ""

    var filtered: [Transaction] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !query.isEmpty else { return transactions }
        return transactions.filter {
            $0.name.lowercased().contains(query)
                || Categories.label($0.category).lowercased().contains(query)
        }
    }

    var grouped: [(date: Date, items: [Transaction])] {
        let cal = Calendar.current
        let sorted = filtered.sorted { $0.date > $1.date }
        var sections: [(Date, [Transaction])] = []
        for t in sorted {
            let day = cal.startOfDay(for: t.date)
            if let idx = sections.firstIndex(where: { cal.isDate($0.0, inSameDayAs: day) }) {
                sections[idx].1.append(t)
            } else {
                sections.append((day, [t]))
            }
        }
        return sections
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            async let txnsTask = RESTAPI.transactions()
            async let accountsTask = RESTAPI.balanceAccounts()
            let (txns, accts) = try await (txnsTask, accountsTask)
            transactions = txns
            accounts = accts
        } catch let error as BudgieError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Something went wrong."
        }
        isLoading = false
    }
}

struct TransactionsView: View {
    @State private var vm = TransactionsViewModel()
    @State private var showAddWizard = false
    @State private var showAccountEditor = false
    @State private var detailTransaction: Transaction?
    @State private var showExport = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    if let errorMessage = vm.errorMessage {
                        ErrorBanner(message: errorMessage)
                            .padding(.horizontal, 20)
                            .padding(.bottom, 10)
                    }

                    searchField
                        .padding(.horizontal, 20)
                        .padding(.bottom, 12)

                    if vm.isLoading {
                        ProgressView().padding(.vertical, 60)
                    } else if vm.transactions.isEmpty && vm.searchText.isEmpty {
                        EmptyStateView(icon: SFIcons.transactions, title: "No transactions yet",
                                       message: "Track your first income or expense to get started.")
                        Button {
                            showAddWizard = true
                        } label: {
                            Text("Add Transaction")
                        }
                        .buttonStyle(.budgieSuccess(height: 46))
                        .padding(.horizontal, 20)
                    } else if vm.filtered.isEmpty {
                        EmptyStateView(icon: SFIcons.search, title: "No results",
                                       message: "No transactions match \"\(vm.searchText)\".")
                    } else {
                        LazyVStack(spacing: 0, pinnedViews: []) {
                            ForEach(Array(vm.grouped.enumerated()), id: \.offset) { _, section in
                                Text(sectionLabel(section.date))
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Color.budgieTextTertiary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.horizontal, 20)
                                    .padding(.top, 18)
                                    .padding(.bottom, 8)

                                RowContainer {
                                    ForEach(Array(section.items.enumerated()), id: \.element.id) { index, txn in
                                        if index > 0 { RowDivider() }
                                        TransactionRow(transaction: txn) {
                                            detailTransaction = txn
                                        }
                                        .staggeredReveal(index: index)
                                    }
                                }
                                .padding(.horizontal, 20)
                            }
                        }
                    }
                }
                .padding(.bottom, 24)
            }
            .background(Color(.systemBackground))
            .refreshable { await vm.load() }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 4) {
                        Button {
                            showExport = true
                        } label: {
                            Image(systemName: SFIcons.pdf)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(Color.budgieTextPrimary)
                                .frame(width: 34, height: 34)
                                .background(Circle().fill(Color.budgieSurfaceGray))
                        }
                        .disabled(vm.transactions.isEmpty)
                        Button {
                            if vm.accounts.isEmpty {
                                showAccountEditor = true
                            } else {
                                showAddWizard = true
                            }
                        } label: {
                            Image(systemName: SFIcons.plus)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(Color.budgieBrand)
                                .frame(width: 34, height: 34)
                                .background(Circle().fill(Color.budgieIncomePastel.opacity(0.4)))
                        }
                    }
                }
            }
            .navigationTitle("Transactions")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showAddWizard) {
                if vm.accounts.isEmpty {
                    noAccountsSheet
                } else {
                    AddTransactionWizard(accounts: vm.accounts) {
                        Task { await vm.load() }
                    }
                    .presentationDetents([.large])
                }
            }
            .sheet(isPresented: $showAccountEditor) {
                NavigationStack {
                    AccountEditorView(account: nil) {
                        Task { await vm.load() }
                    }
                }
                .presentationDetents([.large])
            }
            .sheet(item: $detailTransaction) { txn in
                TransactionDetailSheet(transaction: txn) {
                    Task { await vm.load() }
                }
                .presentationDetents([.medium, .large])
            }
            .sheet(isPresented: $showExport) {
                PDFExportView(transactions: vm.filtered)
                    .presentationDetents([.medium])
            }
            .task { await vm.load() }
            .onReceive(NotificationCenter.default.publisher(for: .budgieAppDidBecomeActive)) { _ in
                Task { await vm.load() }
            }
        }
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: SFIcons.search)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color.budgieTextTertiary)
            TextField("Search transactions", text: $vm.searchText)
                .font(.system(size: 15))
                .autocorrectionDisabled()
            if !vm.searchText.isEmpty {
                Button {
                    vm.searchText = ""
                } label: {
                    Image(systemName: SFIcons.close)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Color.budgieTextSecondary)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding(.horizontal, 14)
        .frame(height: 42)
        .background(Capsule().fill(Color.budgieSurfaceGray))
    }

    private var noAccountsSheet: some View {
        VStack(spacing: 16) {
            EmptyStateView(icon: SFIcons.wallet, title: "Add an account first",
                           message: "You need at least one account before adding transactions.")
            Button {
                showAccountEditor = true
            } label: {
                Text("Add Account")
            }
            .buttonStyle(.budgieSuccess(height: 46))
        }
        .padding(24)
        .presentationBackground(.ultraThinMaterial)
    }

    private func sectionLabel(_ date: Date) -> String {
        let today = startOfToday()
        if isSameDay(date, today) { return "Today" }
        if isSameDay(date, Calendar.current.date(byAdding: .day, value: -1, to: today) ?? today) {
            return "Yesterday"
        }
        return formatDate(date)
    }
}

// MARK: - Row

struct TransactionRow: View {
    var transaction: Transaction
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(transaction.type.strongColor.opacity(0.14))
                        .frame(width: 38, height: 38)
                    Image(systemName: transaction.type.iconName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(transaction.type.strongColor)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(transaction.name)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(Color.budgieTextPrimary)
                        .lineLimit(1)
                    Text("\(Categories.label(transaction.category)) · \(accountName)")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.budgieTextSecondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 4)
                VStack(alignment: .trailing, spacing: 2) {
                    Text(signedRupiah(signedAmount))
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(transaction.type.strongColor)
                    Text(formatTime(transaction.date))
                        .font(.system(size: 11))
                        .foregroundStyle(Color.budgieTextTertiary)
                }
            }
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var signedAmount: Double {
        transaction.type == .expense ? -transaction.amount : transaction.amount
    }

    private var accountName: String {
        switch transaction.type {
        case .transfer:
            let from = transaction.balanceAccount?.name ?? "Deleted account"
            let to = transaction.toBalanceAccount?.name ?? "Deleted account"
            return "\(from) → \(to)"
        default:
            return transaction.balanceAccount?.name ?? "Deleted account"
        }
    }
}