import SwiftUI

@MainActor
@Observable
final class DashboardViewModel {
    var accounts: [BalanceAccount] = []
    var transactions: [Transaction] = []
    var plus: Bool = false
    var isLoading = true
    var errorMessage: String?

    var netWorth: Double { accounts.reduce(0) { $0 + $1.balance } }

    var hasInsight: Bool {
        transactions.contains { isSameYear($0.date, Date()) }
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            async let accountsTask = RESTAPI.balanceAccounts()
            async let txnsTask = RESTAPI.transactions()
            let (accountsResult, txnsResult) = try await (accountsTask, txnsTask)
            accounts = applyStoredOrder(accountsResult)
            transactions = txnsResult
            if let status = try? await RESTAPI.userStatus() {
                plus = status.plus
            }
        } catch let error as BudgieError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Something went wrong."
        }
        isLoading = false
    }

    private func applyStoredOrder(_ result: [BalanceAccount]) -> [BalanceAccount] {
        guard let userId = SessionStore.shared.user?.id else { return result }
        let order = LocalStore.accountOrder(for: userId)
        guard !order.isEmpty else { return result }
        return result.sorted { a, b in
            let ai = order.firstIndex(of: a.id) ?? Int.max
            let bi = order.firstIndex(of: b.id) ?? Int.max
            return ai < bi
        }
    }

    /// Drag & drop reorder (client-side preference, persisted per user).
    func moveAccount(_ draggedId: String, to targetId: String) {
        guard let from = accounts.firstIndex(where: { $0.id == draggedId }),
              let to = accounts.firstIndex(where: { $0.id == targetId }) else { return }
        withAnimation(.easeOut(duration: 0.25)) {
            accounts.move(fromOffsets: IndexSet(integer: from), toOffset: to > from ? to + 1 : to)
        }
        if let userId = SessionStore.shared.user?.id {
            LocalStore.saveAccountOrder(accounts.map(\.id), for: userId)
        }
    }
}

struct DashboardView: View {
    @Environment(SessionStore.self) private var session
    @State private var vm = DashboardViewModel()
    @State private var showAccountEditor = false
    @State private var editingAccount: BalanceAccount?
    @State private var showEMoneyScanner = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    if let errorMessage = vm.errorMessage {
                        ErrorBanner(message: errorMessage)
                    }

                    NetWorthHero(netWorth: vm.netWorth, accounts: vm.accounts, transactions: vm.transactions)

                    accountsSection

                    insightSection
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
            .background(Color(.systemBackground))
            .refreshable { await vm.load() }
            .navigationTitle("Budgie")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    if !vm.plus {
                        NavigationLink {
                            ProfileView()
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: SFIcons.sparkles)
                                    .font(.system(size: 10, weight: .bold))
                                Text("Plus")
                                    .font(.system(size: 12, weight: .bold))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Capsule().glassEffect(.regular.tint(Color.budgieBrand), in: .capsule))
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    NavigationLink {
                        ProfileView()
                    } label: {
                        avatar
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .navigationDestination(isPresented: $showAccountEditor) {
                AccountEditorView(account: editingAccount) {
                    Task { await vm.load() }
                }
            }
            .sheet(isPresented: $showEMoneyScanner) {
                EMoneyScannerView {
                    Task { await vm.load() }
                }
                .presentationDetents([.large])
            }
            .task { await vm.load() }
            .onReceive(NotificationCenter.default.publisher(for: .budgieAppDidBecomeActive)) { _ in
                Task { await vm.load() }
            }
        }
    }

    private var avatar: some View {
        ZStack {
            Circle().fill(Color.budgieBrand)
            Text(initials)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
        }
        .frame(width: 36, height: 36)
    }

    private var initials: String {
        let name = session.user?.name ?? "User"
        let parts = name.split(separator: " ").prefix(2)
        let chars = parts.map { String($0.prefix(1)) }.joined()
        return chars.isEmpty ? "U" : chars.uppercased()
    }

    private var accountsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                sectionTitle("Your Accounts")
                Spacer()
                Button {
                    showEMoneyScanner = true
                } label: {
                    HStack(spacing: 5) {
                        Image(systemName: "wave.3.right")
                            .font(.system(size: 10, weight: .bold))
                        Text("Scan e-money")
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        Capsule().glassEffect(.regular.tint(Color.budgieBrand), in: .capsule)
                    )
                }
                .buttonStyle(PlainButtonStyle())
            }
            if vm.isLoading {
                ProgressView().frame(maxWidth: .infinity).padding(.vertical, 20)
            } else if vm.accounts.isEmpty {
                GlassCard {
                    VStack(spacing: 10) {
                        Text("No accounts yet")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text("Add your bank, wallet or cash to start tracking.")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.budgieTextSecondary)
                        Button {
                            editingAccount = nil
                            showAccountEditor = true
                        } label: {
                            Text("Add Account")
                        }
                        .buttonStyle(.budgieSuccess(height: 42))
                        .padding(.top, 4)
                    }
                }
            } else {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                    ForEach(Array(vm.accounts.enumerated()), id: \.element.id) { index, account in
                        AccountCard(account: account) {
                            editingAccount = account
                            showAccountEditor = true
                        }
                        .staggeredReveal(index: index)
                        .draggable(account.id)
                        .dropDestination(for: String.self) { items, _ in
                            guard let dragged = items.first, dragged != account.id else { return false }
                            vm.moveAccount(dragged, to: account.id)
                            return true
                        }
                    }
                    Button {
                        editingAccount = nil
                        showAccountEditor = true
                    } label: {
                        VStack(spacing: 8) {
                            Image(systemName: SFIcons.plus)
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundStyle(Color.budgieBrand)
                            Text("Add")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Color.budgieTextSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 128)
                        .background(Color.budgieInsetSurface)
                        .clipShape(.rect(cornerRadius: 35))
                        .overlay(
                            RoundedRectangle(cornerRadius: 35)
                                .strokeBorder(Color.budgieHairline, style: StrokeStyle(lineWidth: 1, dash: [5, 5]))
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                    .staggeredReveal(index: vm.accounts.count)
                }
            }
        }
    }

    private var insightSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Insights")
            if vm.isLoading {
                ProgressView().frame(maxWidth: .infinity).padding(.vertical, 20)
            } else if !vm.hasInsight {
                GlassCard {
                    VStack(spacing: 10) {
                        ZStack {
                            Circle().fill(Color.budgieSurfaceGray)
                            Image(systemName: SFIcons.sparkles)
                                .font(.system(size: 22))
                                .foregroundStyle(Color.budgieBrand)
                        }
                        .frame(width: 56, height: 56)
                        Text("No insight yet")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text("Add a transaction to see your cashflow and asset growth.")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.budgieTextSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                let flow = ChartMath.monthCashflow(transactions: vm.transactions, month: Date())
                GlassCard {
                    VStack(spacing: 16) {
                        Text("Today's Cashflow")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Color.budgieTextPrimary)
                        DonutChart(income: flow.income, expense: flow.expense)
                        if flow.income == 0 && flow.expense == 0 {
                            Text("No activity this month yet.")
                                .font(.system(size: 13))
                                .foregroundStyle(Color.budgieTextSecondary)
                        }
                    }
                }
                .staggeredReveal(index: 0, delay: 0.08)
                GlassCard {
                    AssetGrowthChart(transactions: vm.transactions, netWorth: vm.netWorth)
                }
                .staggeredReveal(index: 1, delay: 0.08)
            }
        }
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 20, weight: .semibold))
            .tracking(-0.3)
            .foregroundStyle(Color.budgieTextPrimary)
    }
}

// MARK: - Net worth hero

struct NetWorthHero: View {
    var netWorth: Double
    var accounts: [BalanceAccount]
    var transactions: [Transaction]
    @Environment(AppSettings.self) private var settings

    private var delta: (absolute: Double, pct: Double?) {
        ChartMath.netWorthDelta(accounts: accounts, transactions: transactions)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text("NET WORTH")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(1)
                    .foregroundStyle(.white.opacity(0.75))
                Spacer()
                Button {
                    withAnimation(.easeOut(duration: 0.25)) {
                        settings.masked.toggle()
                    }
                } label: {
                    Image(systemName: settings.masked ? SFIcons.eyeSlash : SFIcons.eye)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(.white.opacity(0.9))
                        .contentTransition(.symbolEffect(.replace))
                        .rotation3DEffect(.degrees(settings.masked ? 0 : 180), axis: (x: 0, y: 1, z: 0))
                        .frame(width: 36, height: 36)
                        .contentShape(Circle())
                }
                .buttonStyle(PlainButtonStyle())
            }

            if settings.masked {
                Text("Rp ••••••")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .tracking(-0.5)
                    .foregroundStyle(.white)
                    .contentTransition(.opacity)
            } else {
                AnimatedNumber(value: netWorth) { formatRupiah($0) }
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .tracking(-0.5)
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                    .contentTransition(.numericText())
            }

            if let pct = delta.pct {
                HStack(spacing: 4) {
                    Image(systemName: pct >= 0 ? "arrow.up.right" : "arrow.down.right")
                        .font(.system(size: 11, weight: .bold))
                    Text("\(signedPercent(pct)) from last month")
                        .font(.system(size: 13, weight: .semibold))
                        .monospacedDigit()
                    Spacer()
                }
                .foregroundStyle(.white.opacity(0.85))
            } else if delta.absolute != 0 {
                HStack(spacing: 4) {
                    Text("\(signedRupiah(delta.absolute)) this month")
                        .font(.system(size: 13, weight: .semibold))
                        .monospacedDigit()
                    Spacer()
                }
                .foregroundStyle(.white.opacity(0.85))
            }
        }
        .padding(22)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(colors: [Color(hex: 0x00CE11), Color(hex: 0x00A508)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .overlay(alignment: .topTrailing) {
            Circle()
                .fill(.white.opacity(0.12))
                .frame(width: 180, height: 180)
                .blur(radius: 40)
                .offset(x: 40, y: -60)
                .allowsHitTesting(false)
        }
        .clipShape(.rect(cornerRadius: 35))
        .shadow(color: Color.budgieBrand.opacity(0.3), radius: 24, x: 0, y: 10)
    }
}

// MARK: - Account card

struct AccountCard: View {
    var account: BalanceAccount
    var onTap: () -> Void
    @Environment(AppSettings.self) private var settings

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(Color.budgieBrand.opacity(0.14))
                            .frame(width: 34, height: 34)
                        Image(systemName: SFIcons.accountIcon(for: account.type))
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Color.budgieBrand)
                    }
                    Text(account.type.capitalized)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.budgieTextSecondary)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(account.name)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.budgieTextPrimary)
                        .lineLimit(1)
                }
                if settings.masked {
                    Text("Rp ••••••")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(Color.budgieTextPrimary)
                        .contentTransition(.opacity)
                } else {
                    AnimatedNumber(value: account.balance) { formatRupiah($0) }
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.budgieTextPrimary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .contentTransition(.numericText())
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(Color.budgieCard)
            .clipShape(.rect(cornerRadius: 35))
            .overlay(
                RoundedRectangle(cornerRadius: 35)
                    .stroke(Color.budgieHairline, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.06), radius: 10, y: 3)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    DashboardView()
        .environment(SessionStore.shared)
}