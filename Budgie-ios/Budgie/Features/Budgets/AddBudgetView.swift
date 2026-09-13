//
//  AddBudgetView.swift
//  Budgie
//
//  Cash App-style flow: details (period + category) -> limit amount -> success.
//

import SwiftUI

struct AddBudgetView: View {
    var existingCategories: Set<String>
    var onAdded: () -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var step: Step = .details
    @State private var periodDays = 30
    @State private var customDays = ""
    @State private var category: String?
    @State private var amountRaw = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    @State private var savedCategory = ""
    @State private var savedPeriodDays = 30
    @State private var savedAmount: Double = 0

    private enum Step { case details, amount, success }

    private let periods: [(label: String, days: Int)] = [
        ("Daily", 1), ("Weekly", 7), ("Monthly", 30), ("Custom", 0)
    ]

    private var availableCategories: [String] {
        Categories.expense.filter { !existingCategories.contains($0) }
    }

    private var effectiveDays: Int {
        periodDays == 0 ? max(Int(customDays) ?? 0, 1) : periodDays
    }

    private var canContinue: Bool {
        guard category != nil else { return false }
        if periodDays == 0 {
            return (Int(customDays) ?? 0) >= 1
        }
        return true
    }

    var body: some View {
        Group {
            switch step {
            case .details: detailsStep
            case .amount: amountStep
            case .success: successStep
            }
        }
        .background(Color.budgieScreen)
        .onAppear {
            if category == nil, let first = availableCategories.first {
                category = first
            }
            applyDebugStep()
        }
    }

    // MARK: - Details

    private var detailsStep: some View {
        VStack(spacing: 0) {
            FlowHeader(title: "New Budget", onClose: { dismiss() })

            ScrollView {
                VStack(spacing: 20) {
                    if availableCategories.isEmpty {
                        allBudgetedCard
                    } else {
                        periodSection
                        categorySection
                    }

                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }
                }
                .padding(20)
            }

            CapsuleButton(title: "Next", isEnabled: canContinue && !availableCategories.isEmpty) {
                withAnimation(.easeOut(duration: 0.2)) { step = .amount }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 8)
        }
    }

    private var allBudgetedCard: some View {
        VStack(spacing: 8) {
            Text("All categories are budgeted")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)
            Text("Every expense category already has a budget limit.")
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
        .padding(.horizontal, 16)
        .budgieCard()
    }

    private var periodSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("Period")

            HStack(spacing: 8) {
                ForEach(periods, id: \.days) { option in
                    Button {
                        withAnimation(.easeOut(duration: 0.15)) { periodDays = option.days }
                    } label: {
                        Text(option.label)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(periodDays == option.days ? .white : Color.budgieTextSecondary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 40)
                            .background(
                                Capsule().fill(periodDays == option.days ? Color.budgieBrand : Color.budgieSurfaceGray)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }

            if periodDays == 0 {
                InsetCard {
                    HStack(spacing: 8) {
                        Text("Every")
                            .font(.system(size: 15))
                            .foregroundStyle(Color.budgieTextSecondary)
                        Spacer()
                        TextField("30", text: $customDays)
                            .font(.system(size: 15, weight: .medium))
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .tint(.budgieBrand)
                            .frame(width: 70)
                            .onChange(of: customDays) { _, newValue in
                                customDays = String(newValue.filter(\.isNumber).prefix(3))
                            }
                        Text("days")
                            .font(.system(size: 15))
                            .foregroundStyle(Color.budgieTextSecondary)
                    }
                    .padding(.vertical, 12)
                }
            }
        }
    }

    private var categorySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("Category")

            InsetCard {
                ForEach(Array(availableCategories.enumerated()), id: \.element) { index, name in
                    if index > 0 {
                        Divider().overlay(Color.budgieHairline)
                    }
                    Button {
                        withAnimation(.easeOut(duration: 0.15)) { category = name }
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: Categories.icon(name))
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(category == name ? Color.budgieBrand : Color.budgieTextTertiary)
                                .frame(width: 22)
                            Text(Categories.label(name))
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(Color.budgieTextPrimary)
                            Spacer()
                            if category == name {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 18))
                                    .foregroundStyle(Color.budgieBrand)
                            }
                        }
                        .padding(.vertical, 13)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(Color.budgieTextSecondary)
    }

    // MARK: - Amount

    private var amountStep: some View {
        AmountPad(
            title: "Budget Limit",
            subtitle: "\(category.map(Categories.label) ?? "") · \(periodLabel(effectiveDays))",
            raw: $amountRaw,
            accent: .budgieBrand,
            buttonTitle: "Add",
            isLoading: isSubmitting,
            isEnabled: (Double(amountRaw) ?? 0) > 0,
            errorMessage: errorMessage,
            onClose: { dismiss() },
            onSubmit: submit
        )
    }

    // MARK: - Success

    private var successStep: some View {
        SuccessView(
            title: "You set \(formatRupiah(savedAmount)) for \(Categories.label(savedCategory))",
            onClose: { dismiss() },
            onDone: { dismiss() }
        ) {
            SuccessCard {
                ZStack {
                    Circle().fill(Color.budgieExpense.opacity(0.12))
                    Image(systemName: Categories.icon(savedCategory))
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(Color.budgieExpense)
                }
                .frame(width: 56, height: 56)

                InsetCard {
                    InsetRow(label: "Category", value: Categories.label(savedCategory))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Period", value: periodLabel(savedPeriodDays))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Limit", value: formatRupiah(savedAmount))
                }
            }
        }
    }

    // MARK: - Logic

    private func submit() {
        guard let category, !isSubmitting else { return }
        let amount = Double(amountRaw) ?? 0
        isSubmitting = true
        errorMessage = nil

        Task {
            do {
                _ = try await RESTAPI.createBudget(
                    category: category,
                    amount: amount,
                    periodDays: effectiveDays
                )
                savedCategory = category
                savedPeriodDays = effectiveDays
                savedAmount = amount
                onAdded()
                withAnimation(.easeOut(duration: 0.25)) { step = .success }
            } catch {
                errorMessage = (error as? BudgieError)?.errorDescription ?? "Something went wrong."
            }
            isSubmitting = false
        }
    }

    private func applyDebugStep() {
        #if DEBUG
        guard let debugStep = DebugSeed.flowStep else { return }
        if category == nil {
            category = availableCategories.first
        }
        switch debugStep {
        case 2:
            step = .amount
        case 3:
            savedCategory = category ?? "FoodAndDrink"
            savedPeriodDays = 30
            savedAmount = 1_500_000
            step = .success
        default:
            break
        }
        #endif
    }
}

#Preview {
    AddBudgetView(existingCategories: []) {}
}
