//
//  AddAccountView.swift
//  Budgie
//
//  Cash App-style flow: details -> starting balance -> success.
//

import SwiftUI

struct AddAccountView: View {
    var onSaved: () -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var step: Step = .details
    @State private var name = ""
    @State private var type = "bank"
    @State private var amountRaw = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    @State private var savedName = ""
    @State private var savedType = "bank"
    @State private var savedBalance: Double = 0

    private enum Step { case details, amount, success }

    private let types = ["bank", "wallet", "cash", "credit", "investment"]

    private var trimmedName: String {
        name.trimmingCharacters(in: .whitespaces)
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
        .onAppear(perform: applyDebugStep)
    }

    // MARK: - Details

    private var detailsStep: some View {
        VStack(spacing: 0) {
            FlowHeader(title: "Add Account", onClose: { dismiss() })

            ScrollView {
                VStack(spacing: 24) {
                    TextField("Account name", text: $name)
                        .font(.system(size: 22, weight: .semibold))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(Color.budgieTextPrimary)
                        .tint(.budgieBrand)
                        .autocorrectionDisabled()
                        .padding(.horizontal, 16)
                        .frame(height: 60)
                        .background(
                            Color.budgieSurfaceGray,
                            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                        )
                        .padding(.top, 24)

                    typeGrid
                }
                .padding(.horizontal, 20)
            }

            CapsuleButton(title: "Next", isEnabled: !trimmedName.isEmpty) {
                withAnimation(.easeOut(duration: 0.2)) { step = .amount }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 8)
        }
    }

    private var typeGrid: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3),
            spacing: 8
        ) {
            ForEach(types, id: \.self) { accountType in
                Button {
                    withAnimation(.easeOut(duration: 0.15)) { type = accountType }
                } label: {
                    Text(accountType.capitalized)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(type == accountType ? .white : Color.budgieTextSecondary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 42)
                        .background(
                            Capsule().fill(type == accountType ? Color.budgieBrand : Color.budgieSurfaceGray)
                        )
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Amount

    private var amountStep: some View {
        AmountPad(
            title: "Starting Balance",
            subtitle: trimmedName,
            raw: $amountRaw,
            accent: .budgieBrand,
            buttonTitle: "Add",
            isLoading: isSubmitting,
            errorMessage: errorMessage,
            onClose: { dismiss() },
            onSubmit: submit
        )
    }

    // MARK: - Success

    private var successStep: some View {
        SuccessView(
            title: "You added \(formatRupiah(savedBalance)) to \(savedName)",
            onClose: { dismiss() },
            onDone: { dismiss() }
        ) {
            SuccessCard {
                ZStack {
                    Circle().fill(Color.budgieBrand.opacity(0.12))
                    Image(systemName: "building.columns")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(Color.budgieBrand)
                }
                .frame(width: 56, height: 56)

                InsetCard {
                    InsetRow(label: "Name", value: savedName)
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Type", value: savedType.capitalized)
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Starting Balance", value: formatRupiah(savedBalance))
                }
            }
        }
    }

    // MARK: - Logic

    private func submit() {
        guard !isSubmitting else { return }
        isSubmitting = true
        errorMessage = nil
        let balance = Double(amountRaw.isEmpty ? "0" : amountRaw) ?? 0

        Task {
            do {
                let account = try await RESTAPI.createAccount(
                    name: trimmedName,
                    balance: balance,
                    currency: "IDR",
                    type: type
                )
                savedName = account.name
                savedType = account.type
                savedBalance = account.balance
                onSaved()
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
            name = "BCA"
            step = .amount
        case 3:
            savedName = "BCA"
            savedType = "bank"
            savedBalance = 500_000
            step = .success
        default:
            break
        }
        #endif
    }
}

#Preview {
    AddAccountView {}
}
