//
//  DashboardView.swift
//  Budgie
//

import SwiftUI

struct DashboardView: View {
    @Environment(SessionStore.self) private var session
    @Environment(AppSettings.self) private var settings
    @State private var vm = DashboardViewModel()
    @State private var showAddAccount = false
    @State private var showProfile = false
    @State private var detailAccount: BalanceAccount?

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                if let errorMessage = vm.errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                BalanceHeroCard(
                    balance: vm.netWorth,
                    deltaPct: vm.delta.pct,
                    isMasked: settings.masked
                ) {
                    settings.masked.toggle()
                }

                accountsSection

                insightSection
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(Color.budgieBackground)
        .fullScreenCover(isPresented: $showAddAccount) {
            AddAccountView {
                Task { await vm.load() }
            }
        }
        .sheet(isPresented: $showProfile) {
            ProfileView()
        }
        .sheet(item: $detailAccount) { account in
            AccountDetailSheet(account: account, transactions: vm.transactions) {
                Task { await vm.load() }
            }
            .presentationDetents([.medium, .large])
        }
        .refreshable { await vm.load() }
        .task { await vm.load() }
        .onAppear {
            #if DEBUG
            if DebugSeed.flow == "account", !showAddAccount {
                showAddAccount = true
            }
            if DebugSeed.flow == "profile" || DebugSeed.flow == "plus", !showProfile {
                showProfile = true
            }
            #endif
        }
        .onChange(of: vm.accounts) { _, accounts in
            #if DEBUG
            if DebugSeed.flow == "accountDetail", detailAccount == nil, let first = accounts.first {
                detailAccount = first
            }
            #endif
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("Money")
                .font(.system(size: 30, weight: .bold))
                .tracking(-0.5)
                .foregroundStyle(Color.budgieTextPrimary)
            Spacer()
            avatar
        }
    }

    private var avatar: some View {
        Button {
            showProfile = true
        } label: {
            ZStack {
                Circle().fill(Color.budgieBrand.opacity(0.15))
                if let imageURL = session.user?.image.flatMap(URL.init(string:)) {
                    AsyncImage(url: imageURL) { image in
                        image.resizable().scaledToFill()
                    } placeholder: {
                        initialsText
                    }
                } else {
                    initialsText
                }
            }
            .frame(width: 36, height: 36)
            .clipShape(Circle())
            .contentShape(Circle())
        }
        .buttonStyle(PressableButtonStyle())
    }

    private var initialsText: some View {
        Text(initials)
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(Color.budgieBrand)
    }

    private var initials: String {
        let name = session.user?.name ?? "User"
        let letters = name.split(separator: " ").prefix(2).compactMap { $0.first }
        return letters.isEmpty ? "U" : String(letters).uppercased()
    }

    // MARK: - Accounts

    private var accountsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                sectionTitle("Accounts")
                Spacer()
                addAccountButton
            }

            if vm.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
            } else if vm.accounts.isEmpty {
                emptyAccountsCard
            } else {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(vm.accounts) { account in
                        AccountCard(
                            account: account,
                            transactions: vm.transactions,
                            isMasked: settings.masked
                        ) {
                            detailAccount = account
                        }
                    }
                }
            }
        }
    }

    private var addAccountButton: some View {
        Button {
            showAddAccount = true
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "plus")
                    .font(.system(size: 12, weight: .bold))
                Text("Add")
                    .font(.system(size: 13, weight: .semibold))
            }
            .foregroundStyle(Color.budgieBrand)
            .padding(.horizontal, 12)
            .frame(height: 32)
            .background(Capsule().fill(Color.budgieBrand.opacity(0.12)))
        }
        .buttonStyle(PressableButtonStyle())
    }

    private var emptyAccountsCard: some View {
        VStack(spacing: 6) {
            Text("No accounts yet")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)
            Text("Your bank, wallet and cash accounts will show up here.")
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .padding(.horizontal, 16)
        .budgieCard()
    }

    // MARK: - Insights

    private var insightSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Insights")

            if vm.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
            } else if !vm.hasInsight {
                insightEmptyCard
            } else {
                cashflowCard

                if !settings.masked {
                    assetGrowthCard
                        .transition(.opacity.combined(with: .scale(scale: 0.98)))
                }
            }
        }
    }

    private var cashflowCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Cashflow")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)

            DonutChart(income: vm.monthFlow.income, expense: vm.monthFlow.expense)

            if vm.monthFlow.income == 0 && vm.monthFlow.expense == 0 {
                Text("No activity this month yet.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.budgieTextSecondary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .budgieCard()
    }

    private var assetGrowthCard: some View {
        AssetGrowthChart(transactions: vm.transactions, netWorth: vm.netWorth)
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .budgieCard()
    }

    private var insightEmptyCard: some View {
        VStack(spacing: 6) {
            Image(systemName: "sparkles")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(Color.budgieBrand)
                .padding(.bottom, 2)
            Text("No insight yet")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)
            Text("Add a transaction to see your cashflow and asset growth.")
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .padding(.horizontal, 16)
        .budgieCard()
    }

    // MARK: - Helpers

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 18, weight: .semibold))
            .foregroundStyle(Color.budgieTextPrimary)
    }
}

#Preview {
    DashboardView()
        .environment(SessionStore.shared)
        .environment(AppSettings.shared)
}
