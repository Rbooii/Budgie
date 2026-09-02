import SwiftUI

struct BudgetDetailSheet: View {
    var budget: Budget
    var spent: Double
    var onDeleted: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    private var remaining: Double { budget.amount - spent }
    private var isOver: Bool { remaining < 0 }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                VStack(spacing: 8) {
                    Text(Categories.label(budget.category))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Color.budgieExpense)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Capsule().fill(Color.budgieExpensePastel.opacity(0.4)))

                    Text("Budget limit")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.budgieTextSecondary)
                    Text(formatRupiah(budget.amount))
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(Color.budgieTextPrimary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    Text("\(formatRupiahCompact(spent)) spent")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color.budgieTextTertiary)
                }

                ProgressTrack(progress: budget.amount > 0 ? spent / budget.amount : 0, isOver: isOver)

                InsetCard {
                    InsetRow(label: "Period", value: periodLabel(budget.periodDays))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Limit", value: formatRupiah(budget.amount))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Spent", value: formatRupiah(spent), valueColor: .budgieExpense)
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Remaining", value: formatRupiah(remaining),
                             valueColor: isOver ? .budgieExpense : .budgieIncome)
                }

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    showDeleteConfirm = true
                } label: {
                    Text("Delete Budget")
                }
                .buttonStyle(.budgieSoftRed(isLoading: isDeleting, expanded: true))
            }
            .padding(20)
        }
        .presentationBackground(.ultraThinMaterial)
        .confirmationDialog(
            "Delete budget?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) { delete() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("\(Categories.label(budget.category)) budget (\(periodLabel(budget.periodDays))). This cannot be undone.")
        }
    }

    private func delete() {
        isDeleting = true
        errorMessage = nil
        Task {
            do {
                try await RESTAPI.deleteBudget(id: budget.id)
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