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
                VStack(spacing: 8) {
                    Text(transaction.type.displayName)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(transaction.type.strongColor)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Capsule().fill(transaction.type.pastelColor.opacity(0.4)))

                    Text(heroAmount)
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(transaction.type.strongColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)

                    Text(transaction.name)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(Color.budgieTextPrimary)
                }

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
                    Text("Delete Transaction")
                }
                .buttonStyle(.budgieSoftRed(isLoading: isDeleting, expanded: true))
            }
            .padding(20)
        }
        .presentationBackground(.ultraThinMaterial)
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

    private var heroAmount: String {
        let sign = transaction.type == .expense ? "-" : "+"
        return "\(sign)\(formatRupiah(transaction.amount))"
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

    private func delete() {
        isDeleting = true
        errorMessage = nil
        Task {
            do {
                try await RESTAPI.deleteTransaction(id: transaction.id)
                onDeleted()
                dismiss()
            } catch let error as BudgieError {
                errorMessage = error.errorDescription
            } catch {
                errorMessage = "Something went wrong."
            }
            isDeleting = false
        }
    }
}