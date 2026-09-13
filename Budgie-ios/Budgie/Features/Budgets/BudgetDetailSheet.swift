//
//  BudgetDetailSheet.swift
//  Budgie
//

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
                header

                ProgressTrack(
                    progress: budget.amount > 0 ? spent / budget.amount : 0,
                    isOver: isOver
                )

                InsetCard {
                    InsetRow(label: "Period", value: periodLabel(budget.periodDays))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Limit", value: formatRupiah(budget.amount))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Spent", value: formatRupiah(spent), valueColor: .budgieExpense)
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(
                        label: "Remaining",
                        value: formatRupiah(remaining),
                        valueColor: isOver ? .budgieExpense : .budgieIncome
                    )
                }

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    showDeleteConfirm = true
                } label: {
                    ZStack {
                        Text("Delete Budget")
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
            "Delete budget?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) { delete() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("\(Categories.label(budget.category)) · \(periodLabel(budget.periodDays)). This cannot be undone.")
        }
    }

    private var header: some View {
        VStack(spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: Categories.icon(budget.category))
                    .font(.system(size: 11, weight: .bold))
                Text(Categories.label(budget.category))
                    .font(.system(size: 12, weight: .semibold))
            }
            .foregroundStyle(Color.budgieExpense)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Capsule().fill(Color.budgieExpense.opacity(0.12)))

            Text(isOver ? "Over by \(formatRupiah(abs(remaining)))" : "\(formatRupiah(remaining)) left")
                .font(.system(size: 30, weight: .bold))
                .monospacedDigit()
                .tracking(-0.5)
                .foregroundStyle(isOver ? Color.budgieExpense : Color.budgieTextPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.5)

            Text("\(formatRupiah(spent)) spent of \(formatRupiah(budget.amount))")
                .font(.system(size: 13))
                .monospacedDigit()
                .foregroundStyle(Color.budgieTextSecondary)
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
            } catch {
                errorMessage = (error as? BudgieError)?.errorDescription ?? "Something went wrong."
            }
            isDeleting = false
        }
    }
}

#Preview {
    BudgetDetailSheet(
        budget: Budget(id: "1", category: "FoodAndDrink", amount: 1_500_000, currency: "IDR",
                       periodDays: 30, userId: "u", createdAt: "", updatedAt: ""),
        spent: 420_000,
        onDeleted: {}
    )
}
