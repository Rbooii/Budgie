import SwiftUI

struct AppTabView: View {
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Dashboard", systemImage: SFIcons.dashboard) }

            TransactionsView()
                .tabItem { Label("Transactions", systemImage: SFIcons.transactions) }

            BudgetsView()
                .tabItem { Label("Budget", systemImage: SFIcons.budgets) }

            ChatView()
                .tabItem { Label("Chat", systemImage: SFIcons.chat) }
        }
        .tint(.budgieBrand)
        .tabBarMinimizeBehavior(.onScrollDown)
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .active {
                NotificationCenter.default.post(name: .budgieAppDidBecomeActive, object: nil)
            }
        }
    }
}

extension Notification.Name {
    static let budgieAppDidBecomeActive = Notification.Name("budgie.appDidBecomeActive")
}