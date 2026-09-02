import SwiftUI

struct ProfileView: View {
    @Environment(SessionStore.self) private var session
    @Environment(AppSettings.self) private var settings
    @State private var isUpgrading = false
    @State private var isDowngrading = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                identityCard

                settingsCard

                if session.plus {
                    plusMemberCard
                } else {
                    upgradeCard
                }

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    Task { await session.signOut() }
                } label: {
                    Text("Sign Out")
                }
                .buttonStyle(.budgieSoftRed(height: 44, expanded: true))
            }
            .padding(20)
        }
        .background(Color(.systemBackground))
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $isUpgrading) {
            PlusPaymentWizard {
                Task { await session.refreshUserState() }
            }
            .presentationDetents([.large])
        }
        .task { await session.refreshUserState() }
    }

    // MARK: Settings

    private var settingsCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("Settings")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)

                InsetCard {
                    HStack {
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Dark Mode")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(Color.budgieTextPrimary)
                            Text("Same Budgie palette, dark glass")
                                .font(.system(size: 12))
                                .foregroundStyle(Color.budgieTextTertiary)
                        }
                        Spacer()
                        Toggle("", isOn: Binding(
                            get: { settings.darkMode },
                            set: { newValue in
                                withAnimation(.easeOut(duration: 0.3)) {
                                    settings.darkMode = newValue
                                }
                            }
                        ))
                        .labelsHidden()
                        .tint(.budgieBrand)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }

    // MARK: Identity card (dark glass)

    private var identityCard: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle().fill(Color.white.opacity(0.15))
                Text(initials)
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(.white)
            }
            .frame(width: 72, height: 72)

            VStack(spacing: 4) {
                Text(session.user?.name ?? "User")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(.white)
                Text(session.user?.email ?? "—")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.7))
            }

            HStack(spacing: 8) {
                HStack(spacing: 4) {
                    Image(systemName: session.plus ? "sparkles" : "person")
                        .font(.system(size: 10, weight: .bold))
                    Text(session.plus ? "Budgie Plus" : "Free")
                        .font(.system(size: 12, weight: .semibold))
                }
                .foregroundStyle(session.plus ? Color(hex: 0x171717) : .white.opacity(0.9))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Capsule().fill(session.plus ? Color.budgieBrand : Color.white.opacity(0.12)))

                if let id = session.user?.id {
                    Text("ID \(String(id.prefix(10)))")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.white.opacity(0.6))
                }
            }

            Divider().overlay(Color.white.opacity(0.15))

            Text("Budgie")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(colors: [Color(hex: 0x171717), Color(hex: 0x2A2A2A)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .clipShape(.rect(cornerRadius: 35))
        .overlay(RoundedRectangle(cornerRadius: 35).stroke(Color.white.opacity(0.1), lineWidth: 1))
        .shadow(color: .black.opacity(0.15), radius: 16, y: 6)
    }

    private var initials: String {
        let name = session.user?.name ?? "User"
        let parts = name.split(separator: " ").prefix(2)
        let chars = parts.map { String($0.prefix(1)) }.joined()
        return chars.isEmpty ? "U" : chars.uppercased()
    }

    // MARK: Plus member card

    private var plusMemberCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    HStack(spacing: 6) {
                        Image(systemName: SFIcons.sparkles)
                            .font(.system(size: 13, weight: .bold))
                        Text("Budgie Plus")
                            .font(.system(size: 17, weight: .bold))
                    }
                    .foregroundStyle(Color.budgieBrand)
                    Spacer()
                    Text("Active")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Color.budgieIncome)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color.budgieIncomePastel.opacity(0.4)))
                }

                Text("Thank you for supporting Budgie. All features are unlocked.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.budgieTextSecondary)

                InsetCard {
                    InsetRow(label: "Plan", value: "Budgie Plus")
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Status", value: "Active", valueColor: .budgieIncome)
                }

                Button {
                    downgrade()
                } label: {
                    Text("Downgrade to Free")
                }
                .buttonStyle(.budgieOutline(isLoading: isDowngrading))
            }
        }
    }

    // MARK: Upgrade card

    private var upgradeCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: SFIcons.sparkles)
                        .font(.system(size: 15, weight: .bold))
                    Text("Budgie Plus")
                        .font(.system(size: 18, weight: .bold))
                }
                .foregroundStyle(Color.budgieBrand)

                Text("50% off your first month")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)

                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("Rp 24.500")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(Color.budgieBrand)
                    Text("Rp 49.000")
                        .font(.system(size: 16, weight: .medium))
                        .monospacedDigit()
                        .foregroundStyle(Color.budgieTextTertiary)
                        .strikethrough()
                    Text("/month")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.budgieTextSecondary)
                }

                Text("Then Rp 49.000 per month. Cancel anytime.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.budgieTextSecondary)

                InsetCard {
                    InsetRow(label: "AI Financial Assistant", value: "Included")
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "All charts & insights", value: "Included")
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "PDF export", value: "Included")
                }

                Button {
                    isUpgrading = true
                } label: {
                    Text("Upgrade to Plus")
                }
                .buttonStyle(.budgieSuccess(height: 48, expanded: true))
            }
        }
    }

    // MARK: Actions

    private func downgrade() {
        isDowngrading = true
        errorMessage = nil
        Task {
            do {
                _ = try await RESTAPI.updateUser(plus: false)
                await session.refreshUserState()
            } catch let error as BudgieError {
                errorMessage = error.errorDescription
            } catch {
                errorMessage = "Something went wrong."
            }
            isDowngrading = false
        }
    }
}