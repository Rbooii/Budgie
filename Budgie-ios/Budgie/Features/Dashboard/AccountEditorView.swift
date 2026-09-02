import SwiftUI

struct AccountEditorView: View {
    var account: BalanceAccount?
    var onSaved: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var type = "bank"
    @State private var balanceInput = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false

    private let types = ["bank", "wallet", "cash", "credit", "ewallet", "investment", "emoney"]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                HStack {
                    Text(account == nil ? "Add Account" : "Edit Account")
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

                VStack(spacing: 12) {
                    TextField("Account name (e.g. BCA)", text: $name)
                        .font(.system(size: 16))
                        .padding(.horizontal, 16)
                        .frame(height: 50)
                        .background(Color.budgieInsetSurface)
                        .clipShape(.rect(cornerRadius: 20))

                    // Type chips — compact, wraps in a grid
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Type")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.budgieTextTertiary)
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())],
                                  alignment: .leading, spacing: 6) {
                            ForEach(types, id: \.self) { t in
                                Button {
                                    withAnimation(.easeOut(duration: 0.15)) { type = t }
                                } label: {
                                    Text(t.capitalized)
                                        .font(.system(size: 11, weight: .medium))
                                        .lineLimit(1)
                                        .foregroundStyle(type == t ? Color.budgieBrand : Color.budgieTextSecondary)
                                        .padding(.horizontal, 10)
                                        .frame(height: 30)
                                        .frame(maxWidth: .infinity)
                                        .background(
                                            Capsule().fill(type == t ? Color.budgieIncomePastel.opacity(0.4) : Color.budgieSurfaceGray)
                                        )
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Balance")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.budgieTextTertiary)
                        TextField("0", text: $balanceInput)
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .keyboardType(.numberPad)
                            .padding(.horizontal, 16)
                            .frame(height: 56)
                            .background(Color.budgieInsetSurface)
                            .clipShape(.rect(cornerRadius: 20))
                            .onChange(of: balanceInput) { _, newValue in
                                balanceInput = formatBalanceInput(newValue)
                            }
                    }
                }
                .padding(16)
                .background(Color.budgieCard)
                .clipShape(.rect(cornerRadius: 35))
                .overlay(RoundedRectangle(cornerRadius: 35).stroke(Color.budgieHairline, lineWidth: 1))

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    save()
                } label: {
                    Text(account == nil ? "Add Account" : "Save Changes")
                }
                .buttonStyle(.budgieSuccess(isLoading: isLoading, expanded: true))
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isLoading)

                if account != nil {
                    Button {
                        showDeleteConfirm = true
                    } label: {
                        Text("Delete Account")
                    }
                    .buttonStyle(.budgieSoftRed(isLoading: isDeleting, expanded: true))
                }
            }
            .padding(20)
        }
        .background(Color(.systemBackground))
        .onAppear(perform: hydrate)
        .confirmationDialog(
            "Delete account?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) { delete() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This account's transactions will also be deleted. This cannot be undone.")
        }
    }

    private func hydrate() {
        guard let account else {
            balanceInput = "0"
            return
        }
        name = account.name
        type = account.type
        balanceInput = formatBalanceInput(String(Int(account.balance)))
    }

    private func save() {
        isLoading = true
        errorMessage = nil
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        let balance = parseBalanceInput(balanceInput)
        Task {
            do {
                if let account {
                    _ = try await RESTAPI.updateAccount(id: account.id, name: trimmed,
                                                        balance: balance, currency: "IDR", type: type)
                } else {
                    _ = try await RESTAPI.createAccount(name: trimmed, balance: balance, currency: "IDR", type: type)
                }
                onSaved()
                dismiss()
            } catch let error as BudgieError {
                errorMessage = error.errorDescription
            } catch {
                errorMessage = "Something went wrong."
            }
            isLoading = false
        }
    }

    private func delete() {
        guard let account else { return }
        isDeleting = true
        Task {
            do {
                try await RESTAPI.deleteAccount(id: account.id)
                onSaved()
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