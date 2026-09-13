//
//  RootView.swift
//  Budgie
//
//  App entry switch: splash -> signed-in shell or the onboarding/auth flow.
//

import SwiftUI

struct RootView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        Group {
            if session.isBootstrapping {
                SplashView()
            } else if session.isSignedIn {
                AppTabView()
            } else {
                NavigationStack {
                    LandingView()
                }
            }
        }
        .task { await session.bootstrap() }
    }
}

struct SplashView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image("logo")
                .resizable()
                .scaledToFit()
                .frame(width: 84, height: 84)
            ProgressView()
                .tint(.budgieBrand)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.budgieScreen)
    }
}

#Preview {
    RootView()
        .environment(SessionStore.shared)
}
