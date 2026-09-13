//
//  AppTabView.swift
//  Budgie
//
//  Signed-in shell. Uses the native iOS 26 Liquid Glass tab bar.
//

import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
    case home
    case transactions
    case budget
    case chat

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home: return "Home"
        case .transactions: return "Transactions"
        case .budget: return "Budget"
        case .chat: return "Chat"
        }
    }

    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .transactions: return "arrow.left.arrow.right"
        case .budget: return "chart.pie.fill"
        case .chat: return "message.fill"
        }
    }
}

struct AppTabView: View {
    @State private var tab: AppTab = {
        #if DEBUG
        return DebugSeed.initialTab ?? .home
        #else
        return .home
        #endif
    }()

    var body: some View {
        TabView(selection: $tab) {
            DashboardView()
                .tabItem { Label(AppTab.home.title, systemImage: AppTab.home.icon) }
                .tag(AppTab.home)

            TransactionsView()
                .tabItem { Label(AppTab.transactions.title, systemImage: AppTab.transactions.icon) }
                .tag(AppTab.transactions)

            BudgetsView()
                .tabItem { Label(AppTab.budget.title, systemImage: AppTab.budget.icon) }
                .tag(AppTab.budget)

            ChatView()
                .tabItem { Label(AppTab.chat.title, systemImage: AppTab.chat.icon) }
                .tag(AppTab.chat)
        }
        .tint(.budgieBrand)
        .tabBarMinimizeBehavior(.onScrollDown)
    }
}

#Preview {
    AppTabView()
        .environment(SessionStore.shared)
        .environment(AppSettings.shared)
}
