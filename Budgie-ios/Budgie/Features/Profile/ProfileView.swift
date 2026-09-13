//
//  ProfileView.swift
//  Budgie
//
//  User & settings: identity, Budgie Plus upgrade/downgrade, preferences, sign out.
//

import SwiftUI

struct ProfileView: View {
    @Environment(SessionStore.self) private var session
    @Environment(AppSettings.self) private var settings
    @Environment(\.dismiss) private var dismiss

    @State private var showUpgrade = false
    @State private var showSignOutConfirm = false
    @State private var isDowngrading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            FlowHeader(title: "Profile", onClose: { dismiss() })

            ScrollView {
                VStack(spacing: 20) {
                    identityCard

                    if session.plus {
                        plusMemberCard
                    } else {
                        upgradeCard
                    }

                    settingsSection

                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }

                    signOutButton

                    Text("Budgie · v1.0")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.budgieTextTertiary)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 4)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
        }
        .background(Color.budgieBackground)
        .onAppear {
            #if DEBUG
            if DebugSeed.flow == "plus" || DebugSeed.flowStep != nil {
                showUpgrade = true
            }
            #endif
        }
        .sheet(isPresented: $showUpgrade) {
            PlusPaymentWizard {
                Task { await session.refreshPlus() }
            }
            .presentationDetents([.large])
        }
        .confirmationDialog(
            "Sign out of Budgie?",
            isPresented: $showSignOutConfirm,
            titleVisibility: .visible
        ) {
            Button("Sign Out", role: .destructive) {
                Task { await session.signOut() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You can sign back in anytime.")
        }
        .task { await session.refreshPlus() }
    }

    // MARK: - Identity

    private var identityCard: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle().fill(.white.opacity(0.15))
                Text(initials)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(.white)
            }
            .frame(width: 64, height: 64)

            VStack(spacing: 3) {
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
                .background(
                    Capsule().fill(session.plus ? Color.budgieBrand : Color.white.opacity(0.12))
                )

                if let id = session.user?.id {
                    Text("ID \(String(id.prefix(10)))")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.white.opacity(0.6))
                }
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(
                colors: [Color(hex: 0x1C1C1E), Color(hex: 0x2C2C2E)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: .black.opacity(0.15), radius: 16, y: 6)
    }

    private var initials: String {
        let name = session.user?.name ?? "User"
        let letters = name.split(separator: " ").prefix(2).compactMap { $0.first }
        return letters.isEmpty ? "U" : String(letters).uppercased()
    }

    // MARK: - Plus (free)

    private var upgradeCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "sparkles")
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
                    .font(.system(size: 30, weight: .bold))
                    .monospacedDigit()
                    .tracking(-0.5)
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

            CapsuleButton(title: "Upgrade to Plus") {
                showUpgrade = true
            }
            .padding(.top, 2)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .budgieCard()
    }

    // MARK: - Plus (member)

    private var plusMemberCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "sparkles")
                    .font(.system(size: 13, weight: .bold))
                Text("Budgie Plus")
                    .font(.system(size: 17, weight: .bold))
                Spacer()
                Text("Active")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Color.budgieIncome)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(Color.budgieIncome.opacity(0.12)))
            }
            .foregroundStyle(Color.budgieBrand)

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
                ZStack {
                    Text("Downgrade to Free")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.budgieTextPrimary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(Color.budgieSurfaceGray, in: Capsule())
                    if isDowngrading {
                        ProgressView().tint(.budgieTextPrimary)
                    }
                }
            }
            .buttonStyle(PressableButtonStyle())
            .disabled(isDowngrading)
            .padding(.top, 2)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .budgieCard()
    }

    // MARK: - Settings

    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Settings")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)

            InsetCard {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Appearance")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text("Follows your device by default")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.budgieTextTertiary)
                    }
                    Spacer()
                    Menu {
                        ForEach(AppearancePreference.allCases) { option in
                            Button {
                                settings.appearance = option
                            } label: {
                                if option == settings.appearance {
                                    Label(option.label, systemImage: "checkmark")
                                } else {
                                    Text(option.label)
                                }
                            }
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Text(settings.appearance.label)
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(Color.budgieTextPrimary)
                            Image(systemName: "chevron.up.chevron.down")
                                .font(.system(size: 10))
                                .foregroundStyle(Color.budgieTextTertiary)
                        }
                    }
                }
                .padding(.vertical, 8)

                Divider().overlay(Color.budgieHairline)

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Hide balance")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text("Mask amounts on Home")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.budgieTextTertiary)
                    }
                    Spacer()
                    Toggle("", isOn: Binding(
                        get: { settings.masked },
                        set: { settings.masked = $0 }
                    ))
                    .labelsHidden()
                    .tint(.budgieBrand)
                }
                .padding(.vertical, 8)
            }
        }
    }

    // MARK: - Sign out

    private var signOutButton: some View {
        Button {
            showSignOutConfirm = true
        } label: {
            Text("Sign Out")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.budgieExpense)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(Color.budgieExpense.opacity(0.12), in: Capsule())
        }
        .buttonStyle(PressableButtonStyle())
    }

    // MARK: - Actions

    private func downgrade() {
        isDowngrading = true
        errorMessage = nil
        Task {
            do {
                _ = try await RESTAPI.updateUser(plus: false)
                await session.refreshPlus()
            } catch {
                errorMessage = (error as? BudgieError)?.errorDescription ?? "Something went wrong."
            }
            isDowngrading = false
        }
    }
}

#Preview {
    ProfileView()
        .environment(SessionStore.shared)
        .environment(AppSettings.shared)
}
