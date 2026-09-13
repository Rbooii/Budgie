//
//  AccountDetailSheet.swift
//  Budgie
//
//  Account drawer: balance, this-month income & spending, recent activity,
//  and account deletion.
//

import SwiftUI

struct AccountDetailSheet: View {
    var account: BalanceAccount
    var transactions: [Transaction]
    var onDeleted: () -> Void

    @Environment(AppSettings.self) private var settings
    @Environment(\.dismiss) private var dismiss

    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    private var accountTransactions: [Transaction] {
        transactions
            .filter { $0.balanceAccountId == account.id || $0.toBalanceAccountId == account.id }
            .sorted { $0.date > $1.date }
    }

    private var monthIncome: Double {
        accountTransactions
            .filter { $0.type == .income && $0.balanceAccountId == account.id && isSameMonth($0.date, Date()) }
            .reduce(0) { $0 + $1.amount }
    }

    private var monthSpending: Double {
        accountTransactions
            .filter { $0.type == .expense && $0.balanceAccountId == account.id && isSameMonth($0.date, Date()) }
            .reduce(0) { $0 + $1.amount }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                header
                stats
                recentSection

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                deleteButton
            }
            .padding(20)
        }
        .budgieDrawer()
        .confirmationDialog(
            "Delete \(account.name)?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) { delete() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This account's transactions will also be deleted. This cannot be undone.")
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 10) {
            ZStack {
                Circle().fill(Color.budgieBrand.opacity(0.12))
                Image(systemName: AccountTypes.icon(for: account.type))
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(Color.budgieBrand)
            }
            .frame(width: 56, height: 56)

            Text(account.name)
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(Color.budgieTextPrimary)

            Text(AccountTypes.label(for: account.type))
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color.budgieTextSecondary)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Capsule().fill(Color.budgieSurfaceGray))

            Text(settings.masked ? "Rp ••••••" : formatRupiah(account.balance))
                .font(.system(size: 30, weight: .bold))
                .monospacedDigit()
                .tracking(-0.5)
                .foregroundStyle(Color.budgieTextPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .contentTransition(.opacity)
                .padding(.top, 2)
        }
    }

    // MARK: - Stats

    private var stats: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("This month")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color.budgieTextTertiary)

            HStack(spacing: 12) {
                statTile(label: "Income", value: monthIncome, tint: .budgieIncome)
                statTile(label: "Spending", value: monthSpending, tint: .budgieExpense)
            }
        }
    }

    private func statTile(label: String, value: Double, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 12))
                .foregroundStyle(Color.budgieTextTertiary)
            Text(settings.masked ? "Rp •••" : formatRupiah(value))
                .font(.system(size: 16, weight: .bold))
                .monospacedDigit()
                .tracking(-0.3)
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.budgieCard, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.budgieHairline, lineWidth: 1)
        )
    }

    // MARK: - Recent activity

    private var recentSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Recent activity")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer()
                if accountTransactions.count > 5 {
                    Text("\(accountTransactions.count) total")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.budgieTextTertiary)
                }
            }

            if accountTransactions.isEmpty {
                Text("No transactions yet.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.budgieTextSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
                    .background(Color.budgieCard, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(Color.budgieHairline, lineWidth: 1)
                    )
            } else {
                InsetCard {
                    ForEach(Array(accountTransactions.prefix(5).enumerated()), id: \.element.id) { index, transaction in
                        if index > 0 {
                            Divider().overlay(Color.budgieHairline)
                        }
                        activityRow(transaction)
                    }
                }
            }
        }
    }

    private func activityRow(_ transaction: Transaction) -> some View {
        HStack(spacing: 10) {
            Image(systemName: transaction.type.iconName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(transaction.type.strongColor)
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 1) {
                Text(transaction.name)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.budgieTextPrimary)
                    .lineLimit(1)
                Text(Categories.label(transaction.category))
                    .font(.system(size: 11))
                    .foregroundStyle(Color.budgieTextTertiary)
                    .lineLimit(1)
            }

            Spacer(minLength: 8)

            Text(formatRupiah(transaction.amount))
                .font(.system(size: 14, weight: .semibold))
                .monospacedDigit()
                .foregroundStyle(transaction.type.strongColor)
        }
        .padding(.vertical, 11)
    }

    // MARK: - Delete

    private var deleteButton: some View {
        Button {
            showDeleteConfirm = true
        } label: {
            ZStack {
                Text("Delete Account")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.budgieExpense)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(Color.budgieExpense.opacity(0.12), in: Capsule())
                if isDeleting {
                    ProgressView().tint(.budgieExpense)
                }
            }
        }
        .buttonStyle(PressableButtonStyle())
        .disabled(isDeleting)
    }

    private func delete() {
        isDeleting = true
        errorMessage = nil
        Task {
            do {
                try await RESTAPI.deleteAccount(id: account.id)
                onDeleted()
                dismiss()
            } catch {
                errorMessage = (error as? BudgieError)?.errorDescription ?? "Something went wrong."
            }
            isDeleting = false
        }
    }
}

#Preview {
    AccountDetailSheet(
        account: BalanceAccount(id: "1", name: "BCA", balance: 2_500_000, currency: "IDR",
                                type: "bank", userId: "u", createdAt: "", updatedAt: ""),
        transactions: [],
        onDeleted: {}
    )
    .environment(AppSettings.shared)
}
