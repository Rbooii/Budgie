//
//  BudgieApp.swift
//  Budgie
//

import SwiftUI

@main
struct BudgieApp: App {
    @State private var session = SessionStore.shared
    @State private var settings = AppSettings.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .environment(settings)
                .tint(.budgieBrand)
                .preferredColorScheme(settings.appearance.colorScheme)
        }
    }
}
