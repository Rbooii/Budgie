//
//  AddTransactionView.swift
//  Budgie
//
//  Cash App-style flow: details -> amount -> success.
//

import SwiftUI

struct AddTransactionView: View {
    var onAdded: () -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var step: Step = .details
    @State private var type: TransactionType = .expense
    @State private var amountRaw = ""
    @State private var name = ""
    @State private var sourceAccountId: String?
    @State private var destAccountId: String?
    @State private var category = "FoodAndDrink"
    @State private var adminFeeRaw = ""
    @State private var date = Date()
    @State private var accounts: [BalanceAccount] = []
    @State private var isLoadingAccounts = true
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    @State private var savedAmount: Double = 0
    @State private var savedAdminFee: Double = 0
    @State private var savedSourceName = ""
    @State private var savedDestName = ""

    private enum Step { case details, amount, success }

    private var trimmedName: String {
        name.trimmingCharacters(in: .whitespaces)
    }

    private var amount: Double {
        Double(amountRaw.isEmpty ? "0" : amountRaw) ?? 0
    }

    private var adminFee: Double {
        Double(adminFeeRaw.isEmpty ? "0" : adminFeeRaw) ?? 0
    }

    private var sourceAccount: BalanceAccount? {
        accounts.first { $0.id == sourceAccountId }
    }

    private var destAccount: BalanceAccount? {
        accounts.first { $0.id == destAccountId }
    }

    private var insufficientBalance: Bool {
        guard let source = sourceAccount else { return false }
        switch type {
        case .expense: return amount > source.balance
        case .transfer: return amount + adminFee > source.balance
        case .income: return false
        }
    }

    private var canContinue: Bool {
        guard !trimmedName.isEmpty, sourceAccountId != nil else { return false }
        if type == .transfer {
            return destAccountId != nil && destAccountId != sourceAccountId
        }
        return true
    }

    private var amountSubtitle: String {
        switch type {
        case .transfer: return "\(sourceAccount?.name ?? "") → \(destAccount?.name ?? "")"
        default: return sourceAccount?.name ?? ""
        }
    }

    private var amountError: String? {
        if insufficientBalance, let source = sourceAccount {
            return "Insufficient balance in \(source.name)."
        }
        return errorMessage
    }

    private var successTitle: String {
        switch type {
        case .income: return "You added \(formatRupiah(savedAmount)) to \(savedSourceName)"
        case .expense: return "You spent \(formatRupiah(savedAmount)) from \(savedSourceName)"
        case .transfer: return "You moved \(formatRupiah(savedAmount)) to \(savedDestName)"
        }
    }

    var body: some View {
        Group {
            if isLoadingAccounts {
                loadingState
            } else if accounts.isEmpty {
                emptyState
            } else {
                switch step {
                case .details: detailsStep
                case .amount: amountStep
                case .success: successStep
                }
            }
        }
        .background(Color.budgieScreen)
        .task { await loadAccounts() }
        .onAppear(perform: applyDebugStep)
    }

    // MARK: - Details

    private var detailsStep: some View {
        VStack(spacing: 0) {
            FlowHeader(title: "Add Transaction", onClose: { dismiss() })

            ScrollView {
                VStack(spacing: 20) {
                    typePicker
                    fieldsCard
                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }
                }
                .padding(20)
            }

            CapsuleButton(title: "Next", isEnabled: canContinue) {
                withAnimation(.easeOut(duration: 0.2)) { step = .amount }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 8)
        }
    }

    private var typePicker: some View {
        HStack(spacing: 8) {
            ForEach(TransactionType.allCases, id: \.self) { transactionType in
                let disabled = transactionType == .transfer && accounts.count < 2
                Button {
                    withAnimation(.easeOut(duration: 0.15)) { select(transactionType) }
                } label: {
                    Text(transactionType.displayName)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(type == transactionType ? .white : Color.budgieTextSecondary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 42)
                        .background(
                            Capsule().fill(type == transactionType ? transactionType.strongColor : Color.budgieSurfaceGray)
                        )
                        .opacity(disabled ? 0.4 : 1)
                }
                .buttonStyle(.plain)
                .disabled(disabled)
            }
        }
    }

    private var fieldsCard: some View {
        InsetCard {
            HStack {
                rowLabel("Name")
                TextField("e.g. Grocery run", text: $name)
                    .font(.system(size: 15, weight: .medium))
                    .multilineTextAlignment(.trailing)
                    .tint(.budgieBrand)
                    .autocorrectionDisabled()
            }
            .padding(.vertical, 12)

            Divider().overlay(Color.budgieHairline)

            accountRow("From", selection: $sourceAccountId)

            if type == .transfer {
                Divider().overlay(Color.budgieHairline)
                accountRow("To", selection: $destAccountId)
            }

            Divider().overlay(Color.budgieHairline)

            categoryRow

            if type == .transfer {
                Divider().overlay(Color.budgieHairline)
                HStack {
                    rowLabel("Admin Fee")
                    Spacer()
                    TextField("0", text: $adminFeeRaw)
                        .font(.system(size: 15, weight: .medium))
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .tint(.budgieBrand)
                        .frame(width: 110)
                        .onChange(of: adminFeeRaw) { _, newValue in
                            adminFeeRaw = String(newValue.filter(\.isNumber).prefix(13))
                        }
                }
                .padding(.vertical, 12)
            }

            Divider().overlay(Color.budgieHairline)

            HStack {
                rowLabel("Date")
                Spacer()
                DatePicker("", selection: $date, displayedComponents: [.date, .hourAndMinute])
                    .labelsHidden()
                    .tint(.budgieBrand)
            }
            .padding(.vertical, 6)
        }
    }

    private func rowLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 15))
            .foregroundStyle(Color.budgieTextSecondary)
    }

    private func accountRow(_ label: String, selection: Binding<String?>) -> some View {
        HStack {
            rowLabel(label)
            Spacer()
            Menu {
                ForEach(accounts) { account in
                    Button {
                        selection.wrappedValue = account.id
                    } label: {
                        Text("\(account.name) · \(formatRupiah(account.balance))")
                    }
                }
            } label: {
                HStack(spacing: 6) {
                    Text(accounts.first { $0.id == selection.wrappedValue }?.name ?? "Select account")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(
                            selection.wrappedValue == nil ? Color.budgieTextTertiary : Color.budgieTextPrimary
                        )
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 10))
                        .foregroundStyle(Color.budgieTextTertiary)
                }
            }
        }
        .padding(.vertical, 12)
    }

    private var categoryRow: some View {
        HStack {
            rowLabel("Category")
            Spacer()
            Menu {
                ForEach(Categories.byType(type), id: \.self) { categoryName in
                    Button {
                        category = categoryName
                    } label: {
                        Text(Categories.label(categoryName))
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

    // MARK: - Amount

    private var amountStep: some View {
        AmountPad(
            title: "Add \(type.displayName)",
            subtitle: amountSubtitle,
            raw: $amountRaw,
            accent: type.strongColor,
            buttonTitle: "Add",
            isLoading: isSubmitting,
            isEnabled: amount > 0 && !insufficientBalance,
            errorMessage: amountError,
            onClose: { dismiss() },
            onSubmit: submit
        )
    }

    // MARK: - Success

    private var successStep: some View {
        SuccessView(
            title: successTitle,
            onClose: { dismiss() },
            onDone: { dismiss() }
        ) {
            SuccessCard {
                ZStack {
                    Circle().fill(type.strongColor.opacity(0.12))
                    Image(systemName: type.iconName)
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(type.strongColor)
                }
                .frame(width: 56, height: 56)

                InsetCard {
                    InsetRow(label: "Name", value: name)
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "From", value: savedSourceName)
                    if type == .transfer {
                        Divider().overlay(Color.budgieHairline)
                        InsetRow(label: "To", value: savedDestName)
                    }
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Category", value: Categories.label(category))
                    if type == .transfer && savedAdminFee > 0 {
                        Divider().overlay(Color.budgieHairline)
                        InsetRow(label: "Admin Fee", value: formatRupiah(savedAdminFee))
                    }
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Date", value: formatDate(date))
                }
            }
        }
    }

    // MARK: - Loading & empty

    private var loadingState: some View {
        VStack(spacing: 0) {
            FlowHeader(title: "Add Transaction", onClose: { dismiss() })
            Spacer()
            ProgressView().tint(.budgieBrand)
            Spacer()
        }
    }

    private var emptyState: some View {
        VStack(spacing: 0) {
            FlowHeader(title: "Add Transaction", onClose: { dismiss() })
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: "wallet.pass")
                    .font(.system(size: 26, weight: .semibold))
                    .foregroundStyle(Color.budgieBrand)
                    .padding(.bottom, 4)
                Text("Add an account first")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                Text("You need at least one account before adding transactions.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.budgieTextSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 32)
            Spacer()
            CapsuleButton(title: "Got it") { dismiss() }
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
        }
    }

    // MARK: - Logic

    private func loadAccounts() async {
        do {
            accounts = try await RESTAPI.balanceAccounts().sorted { $0.createdAt < $1.createdAt }
            sourceAccountId = accounts.first?.id
        } catch {
            errorMessage = (error as? BudgieError)?.errorDescription ?? "Something went wrong."
        }
        isLoadingAccounts = false
    }

    private func select(_ newType: TransactionType) {
        guard newType != type else { return }
        type = newType
        category = Categories.byType(newType).first ?? category
        errorMessage = nil
        if newType == .transfer {
            destAccountId = accounts.first { $0.id != sourceAccountId }?.id
        } else {
            destAccountId = nil
            adminFeeRaw = ""
        }
    }

    private func submit() {
        guard let sourceAccountId, !isSubmitting else { return }
        isSubmitting = true
        errorMessage = nil

        let body = CreateTransactionBody(
            name: trimmedName,
            amount: amount,
            type: type,
            category: category,
            date: date,
            adminFee: adminFee,
            balanceAccountId: sourceAccountId,
            toBalanceAccountId: type == .transfer ? destAccountId : nil
        )

        Task {
            do {
                _ = try await RESTAPI.createTransaction(body)
                savedAmount = amount
                savedAdminFee = adminFee
                savedSourceName = sourceAccount?.name ?? ""
                savedDestName = destAccount?.name ?? ""
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
        switch debugStep {
        case 2:
            step = .amount
        case 3:
            savedAmount = 120_000
            savedSourceName = "Bca"
            name = "Bought a kebab"
            type = .expense
            category = "FoodAndDrink"
            step = .success
        default:
            break
        }
        #endif
    }
}

#Preview {
    AddTransactionView {}
}
