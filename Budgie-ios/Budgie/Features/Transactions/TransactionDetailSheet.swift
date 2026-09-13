//
//  TransactionDetailSheet.swift
//  Budgie
//
//  Bottom-sheet drawer opened from any transaction row.
//

import SwiftUI

struct TransactionDetailSheet: View {
    var transaction: Transaction
    var onDeleted: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                header

                InsetCard {
                    InsetRow(label: "Bank", value: accountName)
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Category", value: Categories.label(transaction.category))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Date", value: formatDate(transaction.date))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Time", value: formatTime(transaction.date))
                    if transaction.type == .transfer && transaction.adminFee > 0 {
                        Divider().overlay(Color.budgieHairline)
                        InsetRow(label: "Admin Fee", value: formatRupiah(transaction.adminFee))
                    }
                }

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    showDeleteConfirm = true
                } label: {
                    ZStack {
                        Text("Delete Transaction")
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
            .padding(20)
        }
        .budgieDrawer()
        .confirmationDialog(
            "Delete transaction?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) { delete() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("\"\(transaction.name)\" · \(formatRupiah(transaction.amount)). This cannot be undone.")
        }
    }

    private var header: some View {
        VStack(spacing: 8) {
            Text(transaction.type.displayName)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(transaction.type.strongColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Capsule().fill(transaction.type.strongColor.opacity(0.12)))

            Text(heroAmount)
                .font(.system(size: 30, weight: .bold))
                .monospacedDigit()
                .tracking(-0.5)
                .foregroundStyle(transaction.type.strongColor)
                .lineLimit(1)
                .minimumScaleFactor(0.5)

            Text(transaction.name)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color.budgieTextPrimary)
                .multilineTextAlignment(.center)
        }
    }

    private var heroAmount: String {
        let sign = transaction.type == .expense ? "-" : "+"
        return "\(sign)\(formatRupiah(transaction.amount))"
    }

    private var accountName: String {
        switch transaction.type {
        case .transfer:
            let from = transaction.balanceAccount?.name ?? "Deleted account"
            let to = transaction.toBalanceAccount?.name ?? "Deleted account"
            return "\(from) to \(to)"
        default:
            return transaction.balanceAccount?.name ?? "Deleted account"
        }
    }

    private func delete() {
        isDeleting = true
        errorMessage = nil
        Task {
            do {
                try await RESTAPI.deleteTransaction(id: transaction.id)
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
    TransactionDetailSheet(
        transaction: Transaction(
            id: "1", name: "Bought a kebab", amount: 120_000, type: .expense,
            category: "FoodAndDrink", date: Date(), adminFee: 0,
            balanceAccountId: "a", toBalanceAccountId: nil, userId: "u",
            createdAt: "", updatedAt: "",
            balanceAccount: AccountRef(id: "a", name: "BCA", currency: "IDR"),
            toBalanceAccount: nil
        ),
        onDeleted: {}
    )
}
