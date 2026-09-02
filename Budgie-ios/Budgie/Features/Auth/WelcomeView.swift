import SwiftUI

struct WelcomeView: View {
    @AppStorage("budgie.hasSeenWelcome") private var hasSeenWelcome = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false
    @State private var drift = false

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color.white.ignoresSafeArea()

                // Floating pastel blobs (drift slowly, Apple Music onboarding vibe)
                blob(color: Color.budgieBrand.opacity(0.35), size: 320,
                     x: 0.88, y: 0.12, drift: 26, geo: geo.size)
                blob(color: Color.budgieIncomePastel.opacity(0.9), size: 360,
                     x: 0.06, y: 0.72, drift: -30, geo: geo.size)
                blob(color: Color.budgieTransferPastel.opacity(0.55), size: 220,
                     x: 0.12, y: 0.16, drift: 20, geo: geo.size)

                VStack(spacing: 0) {
                    Spacer()

                    VStack(spacing: 22) {
                        logoMark
                            .opacity(appeared ? 1 : 0)
                            .scaleEffect(reduceMotion || appeared ? 1 : 0.8)

                        VStack(spacing: 12) {
                            Text("Your money,\nbeautifully simple.")
                                .font(.system(size: 40, weight: .bold, design: .rounded))
                                .tracking(-0.8)
                                .multilineTextAlignment(.center)
                                .foregroundStyle(Color(hex: 0x171717))

                            Text("Budgie tracks your accounts, budgets and subscriptions — quietly, in Rupiah.")
                                .font(.system(size: 16))
                                .multilineTextAlignment(.center)
                                .foregroundStyle(Color(hex: 0x171717).opacity(0.55))
                                .padding(.horizontal, 40)
                        }
                        .opacity(reduceMotion || appeared ? 1 : 0)
                        .offset(y: reduceMotion || appeared ? 0 : 12)
                    }

                    Spacer()

                    VStack(spacing: 14) {
                        Button { finish() } label: { Text("Get Started") }
                            .buttonStyle(WelcomeCTAStyle())

                        Button { finish() } label: {
                            Text("I already use Budgie — Sign in")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(Color(hex: 0x171717).opacity(0.6))
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 34)
                    .opacity(reduceMotion || appeared ? 1 : 0)
                    .offset(y: reduceMotion || appeared ? 0 : 8)
                }
            }
        }
        .onAppear {
            if reduceMotion {
                appeared = true
                drift = true
                return
            }
            withAnimation(.easeOut(duration: 0.6)) { appeared = true }
            withAnimation(.easeInOut(duration: 6).repeatForever(autoreverses: true)) { drift = true }
        }
    }

    private var logoMark: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(
                    LinearGradient(colors: [Color(hex: 0x00CE11), Color(hex: 0x00B609)],
                                   startPoint: .topLeading, endPoint: .bottomTrailing)
                )
            Text("B")
                .font(.system(size: 40, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
        }
        .frame(width: 84, height: 84)
        .shadow(color: Color.budgieBrand.opacity(0.35), radius: 24, x: 0, y: 10)
    }

    private func blob(color: Color, size: CGFloat, x: CGFloat, y: CGFloat, drift driftAmount: CGFloat, geo: CGSize) -> some View {
        Circle()
            .fill(color)
            .frame(width: size, height: size)
            .blur(radius: 70)
            .position(x: x * geo.width,
                      y: y * geo.height + (drift ? driftAmount : -driftAmount))
    }

    private func finish() {
        withAnimation(.easeOut(duration: 0.25)) {
            hasSeenWelcome = true
        }
    }
}

// MARK: - Green glass pill CTA

struct WelcomeCTAStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(
                Capsule()
                    .fill(
                        LinearGradient(colors: [Color(hex: 0x00CE11), Color(hex: 0x00B609)],
                                       startPoint: .top, endPoint: .bottom)
                    )
            )
            .shadow(color: Color.budgieBrand.opacity(0.35), radius: 16, x: 0, y: 6)
            .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.98)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

#Preview {
    WelcomeView()
}