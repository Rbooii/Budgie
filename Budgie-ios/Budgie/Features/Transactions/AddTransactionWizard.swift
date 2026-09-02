import SwiftUI

struct AddTransactionWizard: View {
    var accounts: [BalanceAccount]
    var onAdded: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var step = 1
    @State private var type: TransactionType = .expense
    @State private var amountInput = ""
    @State private var sourceAccountId: String?
    @State private var destAccountId: String?
    @State private var name = ""
    @State private var category = "FoodAndDrink"
    @State private var adminFeeInput = ""
    @State private var date = Date()
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    private var amount: Double { parseBalanceInput(amountInput) }
    private var adminFee: Double { parseBalanceInput(adminFeeInput) }

    private var sourceAccount: BalanceAccount? {
        accounts.first { $0.id == sourceAccountId }
    }

    private var insufficientBalance: Bool {
        guard let source = sourceAccount else { return false }
        switch type {
        case .expense: return amount > source.balance
        case .transfer: return amount + adminFee > source.balance
        case .income: return false
        }
    }

    private var canProceedFromDetails: Bool {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty,
              amount > 0,
              sourceAccountId != nil,
              !insufficientBalance else { return false }
        if type == .transfer {
            return destAccountId != nil && destAccountId != sourceAccountId
        }
        return true
    }

    var body: some View {
        VStack(spacing: 0) {
            // Progress track
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
                case 1: typeStep
                case 2: detailsStep
                default: reviewStep
                }
            }
            .transition(.wizardStep)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .presentationBackground(Color(.systemBackground))
        .onAppear { hydrate() }
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

    // MARK: Step 1 — Type

    private var typeStep: some View {
        ScrollView {
            VStack(spacing: 14) {
                stepTitle("What kind of transaction?", "Choose a type to get started.")

                ForEach(TransactionType.allCases, id: \.self) { t in
                    typeCard(t)
                }

                if accounts.count < 2 {
                    HStack(spacing: 6) {
                        Image(systemName: "info.circle")
                        Text("Add another account to transfer")
                    }
                    .font(.system(size: 13))
                    .foregroundStyle(Color.budgieTextSecondary)
                }

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    withAnimation(.easeOut(duration: 0.2)) {
                        resetForType()
                        step = 2
                    }
                } label: {
                    Text("Continue")
                }
                .buttonStyle(.budgieSuccess(height: 46, expanded: true))
            }
            .padding(20)
        }
    }

    private func typeCard(_ t: TransactionType) -> some View {
        let disabled = t == .transfer && accounts.count < 2
        return Button {
            withAnimation(.easeOut(duration: 0.15)) { type = t }
        } label: {
            HStack(spacing: 14) {
                GlassTile(icon: t.iconName, tint: t.strongColor, size: 48, iconSize: 19)
                VStack(alignment: .leading, spacing: 2) {
                    Text(t.displayName)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(disabled ? Color.budgieTextTertiary : Color.budgieTextPrimary)
                    Text(typeCaption(t))
                        .font(.system(size: 13))
                        .foregroundStyle(Color.budgieTextSecondary)
                }
                Spacer()
                if type == t {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(t.strongColor)
                }
            }
            .padding(14)
            .background(type == t ? t.pastelColor.opacity(0.25) : Color.budgieCard)
            .clipShape(.rect(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(type == t ? t.strongColor.opacity(0.5) : Color.budgieHairline, lineWidth: 1.5)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(disabled)
        .opacity(disabled ? 0.55 : 1)
    }

    private func typeCaption(_ t: TransactionType) -> String {
        switch t {
        case .income: return "Money coming in"
        case .expense: return "Money going out"
        case .transfer: return "Move money between accounts"
        }
    }

    // MARK: Step 2 — Details

    private var detailsStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                stepTitle("Transaction details", "Fill in the details.")

                // Hero amount
                HStack(spacing: 2) {
                    Text("Rp")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(type.strongColor)
                    TextField("0", text: $amountInput)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .keyboardType(.numberPad)
                        .onChange(of: amountInput) { _, newValue in
                            amountInput = formatBalanceInput(newValue)
                        }
                }
                .padding(.horizontal, 20)
                .frame(height: 68)
                .background(Color.budgieInsetSurface)
                .clipShape(.rect(cornerRadius: 20))

                VStack(spacing: 0) {
                    pickerRow("Bank", selection: $sourceAccountId, accounts: accounts, placeholder: "Select account")
                    if type == .transfer {
                        Divider().overlay(Color.budgieHairline)
                        pickerRow("Destination", selection: $destAccountId, accounts: accounts, placeholder: "Select account")
                    }
                    Divider().overlay(Color.budgieHairline)
                    HStack {
                        Text("Name")
                            .font(.system(size: 15))
                            .foregroundStyle(Color.budgieTextSecondary)
                        TextField("e.g. Grocery run", text: $name)
                            .font(.system(size: 15))
                            .multilineTextAlignment(.trailing)
                            .autocorrectionDisabled()
                    }
                    .padding(.vertical, 12)
                    Divider().overlay(Color.budgieHairline)
                    categoryRow
                    if type == .transfer {
                        Divider().overlay(Color.budgieHairline)
                        HStack {
                            Text("Admin Fee")
                                .font(.system(size: 15))
                                .foregroundStyle(Color.budgieTextSecondary)
                            Spacer()
                            HStack(spacing: 2) {
                                Text("Rp")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundStyle(Color.budgieTextTertiary)
                                TextField("0", text: $adminFeeInput)
                                    .font(.system(size: 15, weight: .medium))
                                    .monospacedDigit()
                                    .keyboardType(.numberPad)
                                    .multilineTextAlignment(.trailing)
                                    .frame(width: 110)
                                    .onChange(of: adminFeeInput) { _, newValue in
                                        adminFeeInput = formatBalanceInput(newValue)
                                    }
                            }
                        }
                        .padding(.vertical, 12)
                    }
                    Divider().overlay(Color.budgieHairline)
                    DatePicker("Date", selection: $date, displayedComponents: [.date, .hourAndMinute])
                        .font(.system(size: 15))
                        .foregroundStyle(Color.budgieTextSecondary)
                        .padding(.vertical, 6)
                }
                .padding(.horizontal, 16)
                .background(Color.budgieInsetSurface)
                .clipShape(.rect(cornerRadius: 20))

                if insufficientBalance {
                    ErrorBanner(message: "Insufficient balance in \(sourceAccount?.name ?? "this account").")
                }

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    step = 3
                } label: {
                    Text("Review")
                }
                .buttonStyle(.budgieSuccess(height: 46, expanded: true))
                .disabled(!canProceedFromDetails)
            }
            .padding(20)
        }
    }

    private func pickerRow(_ label: String, selection: Binding<String?>, accounts: [BalanceAccount], placeholder: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 15))
                .foregroundStyle(Color.budgieTextSecondary)
            Spacer()
            Menu {
                ForEach(accounts) { account in
                    Button {
                        selection.wrappedValue = account.id
                    } label: {
                        Text("\(account.name) · \(formatRupiahCompact(account.balance))")
                    }
                }
            } label: {
                HStack(spacing: 6) {
                    Text(accounts.first { $0.id == selection.wrappedValue }?.name ?? placeholder)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(selection.wrappedValue == nil ? Color.budgieTextTertiary : Color.budgieTextPrimary)
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
            Text("Category")
                .font(.system(size: 15))
                .foregroundStyle(Color.budgieTextSecondary)
            Spacer()
            Menu {
                ForEach(Categories.byType(type), id: \.self) { cat in
                    Button {
                        category = cat
                    } label: {
                        HStack {
                            Image(systemName: Categories.icon(cat))
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

    // MARK: Step 3 — Review

    private var reviewStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                stepTitle("Review", "Check everything before confirming.")

                VStack(spacing: 8) {
                    Text(formatRupiah(amount))
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(type.strongColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    HStack(spacing: 8) {
                        Image(systemName: type.iconName)
                            .font(.system(size: 12, weight: .bold))
                        Text(type.displayName)
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundStyle(type.strongColor)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(type.pastelColor.opacity(0.4)))
                }

                InsetCard {
                    InsetRow(label: "Name", value: name)
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Bank", value: sourceAccount?.name ?? "—")
                    if type == .transfer {
                        Divider().overlay(Color.budgieHairline)
                        InsetRow(label: "Destination",
                                 value: accounts.first { $0.id == destAccountId }?.name ?? "—")
                    }
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Category", value: Categories.label(category))
                    if type == .transfer && adminFee > 0 {
                        Divider().overlay(Color.budgieHairline)
                        InsetRow(label: "Admin Fee", value: formatRupiah(adminFee))
                    }
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Date", value: formatDate(date))
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

    // MARK: - Logic

    private func hydrate() {
        sourceAccountId = accounts.first?.id
        if type == .transfer {
            destAccountId = accounts.dropFirst().first?.id
        }
    }

    private func resetForType() {
        category = Categories.byType(type).first ?? category
        adminFeeInput = ""
        if type == .transfer, accounts.count >= 2 {
            destAccountId = accounts.first { $0.id != sourceAccountId }?.id
        } else {
            destAccountId = nil
        }
    }

    private func submit() {
        guard let sourceAccountId else { return }
        isSubmitting = true
        errorMessage = nil
        let body = CreateTransactionBody(
            name: name.trimmingCharacters(in: .whitespaces),
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