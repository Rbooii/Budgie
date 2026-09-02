import SwiftUI

struct AddBudgetWizard: View {
    var existingCategories: Set<String>
    var onAdded: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var step = 1
    @State private var periodDays = 30
    @State private var customDays = ""
    @State private var category: String?
    @State private var amountInput = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    private var amount: Double { parseBalanceInput(amountInput) }

    private var availableCategories: [String] {
        Categories.expense.filter { !existingCategories.contains($0) }
    }

    private var allBudgeted: Bool { availableCategories.isEmpty }

    private var effectiveDays: Int {
        periodDays == 0 ? max(Int(customDays) ?? 0, 1) : periodDays
    }

    private var canProceedToStep2: Bool { !allBudgeted }

    private var canProceedToStep3: Bool {
        category != nil && amount > 0
    }

    var body: some View {
        VStack(spacing: 0) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(Color.budgieHairlineTrack)
                    Rectangle()
                        .fill(Color.budgieBrand)
                        .frame(width: geo.size.width * CGFloat(step) / 3)
                }
            }
            .frame(height: 2)

            topBar

            Group {
                switch step {
                case 1: periodStep
                case 2: categoryStep
                default: reviewStep
                }
            }
            .transition(.wizardStep)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .presentationBackground(Color(.systemBackground))
        .onAppear {
            if allBudgeted { step = 1 }
        }
    }

    private var topBar: some View {
        HStack {
            if step > 1 {
                Button {
                    withAnimation(.easeOut(duration: 0.2)) {
                        step -= 1
                        errorMessage = nil
                    }
                } label: {
                    Image(systemName: SFIcons.chevronLeft)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.budgieTextPrimary)
                }
                .buttonStyle(PlainButtonStyle())
            }
            Spacer()
            Text("\(step) of 3")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.budgieTextSecondary)
            Spacer()
            Button {
                dismiss()
            } label: {
                Image(systemName: SFIcons.close)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.budgieTextSecondary)
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(Color.budgieSurfaceGray))
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
    }

    // MARK: Step 1 — Period

    private var periodStep: some View {
        ScrollView {
            VStack(spacing: 14) {
                stepTitle("Budget period", "How often does this budget reset?")

                periodCard(days: 1, title: "Daily", caption: "Resets every day")
                periodCard(days: 7, title: "Weekly", caption: "Resets every week")
                periodCard(days: 30, title: "Monthly", caption: "Resets every month")

                Button {
                    withAnimation(.easeOut(duration: 0.15)) { periodDays = 0 }
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Custom")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(Color.budgieTextPrimary)
                            Text("Every N days")
                                .font(.system(size: 13))
                                .foregroundStyle(Color.budgieTextSecondary)
                        }
                        Spacer()
                        if periodDays == 0 {
                            TextField("days", text: $customDays)
                                .font(.system(size: 15, weight: .semibold))
                                .keyboardType(.numberPad)
                                .multilineTextAlignment(.trailing)
                                .frame(width: 80)
                                .padding(.horizontal, 12)
                                .frame(height: 36)
                                .background(RoundedRectangle(cornerRadius: 18).fill(Color.budgieSurfaceGray))
                        } else {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 22))
                                .foregroundStyle(Color.budgieBrand)
                        }
                    }
                    .padding(14)
                    .background(periodDays == 0 ? Color.budgieIncomePastel.opacity(0.25) : Color.budgieCard)
                    .clipShape(.rect(cornerRadius: 20))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(periodDays == 0 ? Color.budgieBrand.opacity(0.5) : Color.budgieHairline, lineWidth: 1.5)
                    )
                }
                .buttonStyle(PlainButtonStyle())

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    if periodDays == 0, (Int(customDays) ?? 0) < 1 {
                        errorMessage = "Enter a number of days."
                    } else {
                        withAnimation(.easeOut(duration: 0.2)) { step = 2 }
                    }
                } label: {
                    Text("Continue")
                }
                .buttonStyle(.budgieSuccess(height: 46, expanded: true))
            }
            .padding(20)
        }
    }

    private func periodCard(days: Int, title: String, caption: String) -> some View {
        Button {
            withAnimation(.easeOut(duration: 0.15)) { periodDays = days }
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(Color.budgieTextPrimary)
                    Text(caption)
                        .font(.system(size: 13))
                        .foregroundStyle(Color.budgieTextSecondary)
                }
                Spacer()
                if periodDays == days {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(Color.budgieBrand)
                }
            }
            .padding(14)
            .background(periodDays == days ? Color.budgieIncomePastel.opacity(0.25) : Color.budgieCard)
            .clipShape(.rect(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(periodDays == days ? Color.budgieBrand.opacity(0.5) : Color.budgieHairline, lineWidth: 1.5)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    // MARK: Step 2 — Category + amount

    private var categoryStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                stepTitle("Category & limit", "Pick a category and set your limit.")

                if allBudgeted {
                    GlassCard {
                        Text("All expense categories already have budgets")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Color.budgieTextSecondary)
                            .frame(maxWidth: .infinity)
                    }
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(availableCategories.enumerated()), id: \.offset) { index, cat in
                            Button {
                                withAnimation(.easeOut(duration: 0.15)) { category = cat }
                            } label: {
                                HStack(spacing: 12) {
                                    ZStack {
                                        Circle()
                                            .fill(Color.budgieExpense.opacity(0.14))
                                            .frame(width: 34, height: 34)
                                        Circle()
                                            .fill(Color.budgieExpense)
                                            .frame(width: 8, height: 8)
                                    }
                                    Text(Categories.label(cat))
                                        .font(.system(size: 15, weight: .medium))
                                        .foregroundStyle(Color.budgieTextPrimary)
                                    Spacer()
                                    if category == cat {
                                        Image(systemName: "checkmark.circle.fill")
                                            .font(.system(size: 20))
                                            .foregroundStyle(Color.budgieBrand)
                                    }
                                }
                                .padding(.vertical, 10)
                            }
                            .buttonStyle(PlainButtonStyle())
                            if index < availableCategories.count - 1 {
                                Divider().overlay(Color.budgieHairline)
                            }
                        }
                    }
                    .padding(.horizontal, 14)
                    .background(Color.budgieInsetSurface)
                    .clipShape(.rect(cornerRadius: 20))

                    HStack(spacing: 2) {
                        Text("Rp")
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                            .foregroundStyle(Color.budgieBrand)
                        TextField("0", text: $amountInput)
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .keyboardType(.numberPad)
                            .onChange(of: amountInput) { _, newValue in
                                amountInput = formatBalanceInput(newValue)
                            }
                    }
                    .padding(.horizontal, 20)
                    .frame(height: 64)
                    .background(Color.budgieInsetSurface)
                    .clipShape(.rect(cornerRadius: 20))
                }

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    withAnimation(.easeOut(duration: 0.2)) { step = 3 }
                } label: {
                    Text("Review")
                }
                .buttonStyle(.budgieSuccess(height: 46, expanded: true))
                .disabled(!canProceedToStep3)
            }
            .padding(20)
        }
    }

    // MARK: Step 3 — Review

    private var reviewStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                stepTitle("Review", "Confirm your budget.")

                VStack(spacing: 8) {
                    Text(formatRupiah(amount))
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(Color.budgieBrand)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    if let category {
                        Text(Categories.label(category))
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color.budgieExpense)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Capsule().fill(Color.budgieExpensePastel.opacity(0.4)))
                    }
                }

                InsetCard {
                    InsetRow(label: "Period", value: periodLabel(effectiveDays))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Limit", value: formatRupiah(amount))
                }

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    submit()
                } label: {
                    Text("Confirm and Add")
                }
                .buttonStyle(.budgieSuccess(isLoading: isSubmitting, expanded: true))
            }
            .padding(20)
        }
    }

    private func stepTitle(_ title: String, _ subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 22, weight: .bold))
                .tracking(-0.3)
                .foregroundStyle(Color.budgieTextPrimary)
            Text(subtitle)
                .font(.system(size: 14))
                .foregroundStyle(Color.budgieTextSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func submit() {
        guard let category else { return }
        isSubmitting = true
        errorMessage = nil
        Task {
            do {
                _ = try await RESTAPI.createBudget(category: category, amount: amount, periodDays: effectiveDays)
                onAdded()
                dismiss()
            } catch let error as BudgieError {
                errorMessage = error.errorDescription
            } catch {
                errorMessage = "Something went wrong."
            }
            isSubmitting = false
        }
    }
}