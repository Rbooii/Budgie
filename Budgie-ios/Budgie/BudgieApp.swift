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
                .preferredColorScheme(settings.darkMode ? .dark : .light)
        }
    }
}

struct RootView: View {
    @Environment(SessionStore.self) private var session
    @Environment(AppSettings.self) private var settings
    @AppStorage("budgie.hasSeenWelcome") private var hasSeenWelcome = false

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var splashIn = false

    var body: some View {
        Group {
            if !hasSeenWelcome {
                WelcomeView()
            } else if session.isBootstrapping {
                splash
            } else if session.isSignedIn {
                AppTabView()
            } else {
                SignInView()
            }
        }
        .task {
            await session.bootstrap()
        }
    }

    private var splash: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            VStack(spacing: 16) {
                Text("Budgie")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .tracking(-0.5)
                    .foregroundStyle(Color.budgieBrand)
                    .scaleEffect(reduceMotion || splashIn ? 1 : 0.5)
                    .opacity(reduceMotion || splashIn ? 1 : 0)
                    .onAppear {
                        guard !reduceMotion else { return }
                        withAnimation(.spring(duration: 0.5, bounce: 0.4)) { splashIn = true }
                    }
                ProgressView()
                    .tint(.budgieBrand)
            }
        }
    }
}

#Preview {
    RootView()
}
