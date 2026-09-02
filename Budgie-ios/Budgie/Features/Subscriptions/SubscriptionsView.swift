import SwiftUI

// MARK: - Add subscription (single form per §9.4)

struct AddSubscriptionDialog: View {
    var onAdded: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var category = "Entertainment"
    @State private var periodDays = 30
    @State private var startDate = Date()
    @State private var amountInput = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    private var amount: Double { parseBalanceInput(amountInput) }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                HStack {
                    Text("Add Subscription")
                        .font(.system(size: 22, weight: .bold))
                        .tracking(-0.3)
                        .foregroundStyle(Color.budgieTextPrimary)
                    Spacer()
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: SFIcons.close)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Color.budgieTextSecondary)
                            .frame(width: 34, height: 34)
                            .background(Circle().fill(Color.budgieSurfaceGray))
                    }
                    .buttonStyle(PlainButtonStyle())
                }

                VStack(spacing: 0) {
                    HStack {
                        Text("Name")
                            .font(.system(size: 15))
                            .foregroundStyle(Color.budgieTextSecondary)
                        Spacer()
                        TextField("e.g. Netflix", text: $name)
                            .font(.system(size: 15))
                            .multilineTextAlignment(.trailing)
                            .autocorrectionDisabled()
                    }
                    .padding(.vertical, 12)
                    Divider().overlay(Color.budgieHairline)
                    categoryRow
                    Divider().overlay(Color.budgieHairline)
                    HStack {
                        Text("Billing cycle")
                            .font(.system(size: 15))
                            .foregroundStyle(Color.budgieTextSecondary)
                        Spacer()
                        Menu {
                            Button { periodDays = 7 } label: { Text("Weekly") }
                            Button { periodDays = 30 } label: { Text("Monthly") }
                            Button { periodDays = 365 } label: { Text("Yearly") }
                        } label: {
                            HStack(spacing: 6) {
                                Text(periodLabel(periodDays))
                                    .font(.system(size: 15, weight: .medium))
                                    .foregroundStyle(Color.budgieTextPrimary)
                                Image(systemName: "chevron.up.chevron.down")
                                    .font(.system(size: 10))
                                    .foregroundStyle(Color.budgieTextTertiary)
                            }
                        }
                    }
                    .padding(.vertical, 12)
                    Divider().overlay(Color.budgieHairline)
                    DatePicker("Start date", selection: $startDate, displayedComponents: .date)
                        .font(.system(size: 15))
                        .foregroundStyle(Color.budgieTextSecondary)
                        .padding(.vertical, 6)
                    Divider().overlay(Color.budgieHairline)
                    HStack {
                        Text("Amount")
                            .font(.system(size: 15))
                            .foregroundStyle(Color.budgieTextSecondary)
                        Spacer()
                        HStack(spacing: 2) {
                            Text("Rp")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Color.budgieTextTertiary)
                            TextField("0", text: $amountInput)
                                .font(.system(size: 15, weight: .semibold))
                                .monospacedDigit()
                                .keyboardType(.numberPad)
                                .multilineTextAlignment(.trailing)
                                .frame(width: 120)
                                .onChange(of: amountInput) { _, newValue in
                                    amountInput = formatBalanceInput(newValue)
                                }
                        }
                    }
                    .padding(.vertical, 12)
                }
                .padding(.horizontal, 16)
                .background(Color.budgieInsetSurface)
                .clipShape(.rect(cornerRadius: 20))

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    submit()
                } label: {
                    Text("Add Subscription")
                }
                .buttonStyle(.budgieSuccess(isLoading: isSubmitting, expanded: true))
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || amount <= 0 || isSubmitting)
            }
            .padding(20)
        }
        .presentationBackground(Color(.systemBackground))
    }

    private var categoryRow: some View {
        HStack {
            Text("Category")
                .font(.system(size: 15))
                .foregroundStyle(Color.budgieTextSecondary)
            Spacer()
            Menu {
                ForEach(Categories.expense, id: \.self) { cat in
                    Button {
                        category = cat
                    } label: {
                        HStack {
                            Text(Categories.label(cat))
                        }
                    }
                }
            } label: {
                HStack(spacing: 6) {
                    Text(Categories.label(category))
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(Color.budgieTextPrimary)
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 10))
                        .foregroundStyle(Color.budgieTextTertiary)
                }
            }
        }
        .padding(.vertical, 12)
    }

    private func submit() {
        isSubmitting = true
        errorMessage = nil
        Task {
            do {
                _ = try await RESTAPI.createSubscription(
                    CreateSubscriptionBody(
                        name: name.trimmingCharacters(in: .whitespaces),
                        amount: amount,
                        category: category,
                        periodDays: periodDays,
                        startDate: startDate,
                        active: true
                    ))
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

// MARK: - Subscription detail sheet

struct SubscriptionDetailSheet: View {
    var subscription: Subscription
    var onDeleted: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                VStack(spacing: 8) {
                    Text(subscription.name)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(Color.budgieTextPrimary)
                    Text(formatRupiah(subscription.amount))
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(Color.budgieTransfer)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    HStack(spacing: 8) {
                        Text(subscription.active ? "Active" : "Inactive")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(subscription.active ? Color.budgieIncome : Color.budgieTextSecondary)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(subscription.active
                                                      ? Color.budgieIncomePastel.opacity(0.4)
                                                      : Color.budgieSurfaceGray))
                    }
                }

                InsetCard {
                    InsetRow(label: "Name", value: subscription.name)
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Category", value: Categories.label(subscription.category))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Amount", value: formatRupiah(subscription.amount))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Period", value: periodLabel(subscription.periodDays))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Started", value: formatDate(subscription.startDate))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Next billing", value: formatDate(nextBillingDate(subscription.startDate, subscription.periodDays)))
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Status", value: subscription.active ? "Active" : "Inactive",
                             valueColor: subscription.active ? .budgieIncome : .budgieTextSecondary)
                }

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    showDeleteConfirm = true
                } label: {
                    Text("Delete Subscription")
                }
                .buttonStyle(.budgieSoftRed(isLoading: isDeleting, expanded: true))
            }
            .padding(20)
        }
        .presentationBackground(.ultraThinMaterial)
        .confirmationDialog(
            "Delete subscription?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) { delete() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("\"\(subscription.name)\" · \(formatRupiah(subscription.amount)). This cannot be undone.")
        }
    }

    private func delete() {
        isDeleting = true
        errorMessage = nil
        Task {
            do {
                try await RESTAPI.deleteSubscription(id: subscription.id)
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