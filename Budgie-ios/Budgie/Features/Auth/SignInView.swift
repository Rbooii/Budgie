import SwiftUI

struct SignInView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var mode: Mode = .signIn
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    @State private var appeared = false
    @State private var shimmer = false
    @State private var drift = false
    @FocusState private var focused: Field?

    enum Mode {
        case signIn, signUp
    }

    enum Field: Hashable {
        case name, email, password
    }

    private var spring: Animation { .spring(response: 0.7, dampingFraction: 0.8) }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Spacer(minLength: 56)

                brand

                Spacer(minLength: 40)

                header
                    .offset(y: reduceMotion || appeared ? 0 : 30)
                    .opacity(reduceMotion || appeared ? 1 : 0)
                    .animation(spring.delay(0.1), value: appeared)

                form
                    .offset(y: reduceMotion || appeared ? 0 : 30)
                    .opacity(reduceMotion || appeared ? 1 : 0)
                    .animation(spring.delay(0.25), value: appeared)

                Spacer(minLength: 24)

                footer
                    .offset(y: reduceMotion || appeared ? 0 : 20)
                    .opacity(reduceMotion || appeared ? 1 : 0)
                    .animation(spring.delay(0.4), value: appeared)
            }
            .frame(maxWidth: 420)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 28)
            .padding(.bottom, 32)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(
            ZStack {
                LinearGradient(colors: [Color(hex: 0x00CE11), Color(hex: 0x00B609)],
                               startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()

                GeometryReader { geo in
                    Circle()
                        .fill(.white.opacity(0.09))
                        .frame(width: 260, height: 260)
                        .blur(radius: 60)
                        .position(x: 0.88 * geo.size.width,
                                  y: 0.12 * geo.size.height + (drift ? -24 : 24))
                    Circle()
                        .fill(.white.opacity(0.07))
                        .frame(width: 320, height: 320)
                        .blur(radius: 70)
                        .position(x: 0.08 * geo.size.width,
                                  y: 0.82 * geo.size.height + (drift ? 30 : -30))
                }
                .ignoresSafeArea()
            }
        )
        .onAppear {
            if reduceMotion {
                appeared = true
                shimmer = true
                drift = true
                return
            }
            withAnimation(.easeOut(duration: 0.5)) { appeared = true }
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: false)) { shimmer = true }
            withAnimation(.easeInOut(duration: 5).repeatForever(autoreverses: true)) { drift = true }
        }
    }

    // MARK: - Brand

    private var brand: some View {
        VStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .glassEffect(.regular, in: .rect(cornerRadius: 20))
                    .frame(width: 64, height: 64)
                Text("B")
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.budgieBrand)
            }
            .shadow(color: .black.opacity(0.15), radius: 12, x: 0, y: 5)
            .opacity(reduceMotion || appeared ? 1 : 0)
            .scaleEffect(reduceMotion || appeared ? 1 : 0.6)
            .animation(.spring(response: 0.6, dampingFraction: 0.7).delay(0.05), value: appeared)

            Text("Budgie")
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .tracking(-0.5)
                .foregroundStyle(.white)
                .overlay {
                    LinearGradient(colors: [.white.opacity(0), .white.opacity(0.9), .white.opacity(0)],
                                   startPoint: .leading, endPoint: .trailing)
                        .mask(
                            Text("Budgie")
                                .font(.system(size: 26, weight: .bold, design: .rounded))
                                .tracking(-0.5)
                        )
                        .offset(x: reduceMotion || shimmer ? 180 : -180)
                }
                .opacity(reduceMotion || appeared ? 1 : 0)
                .offset(y: reduceMotion || appeared ? 0 : 10)
                .animation(spring.delay(0.08), value: appeared)
        }
    }

    // MARK: - Header (rolling title)

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(mode == .signIn ? "Welcome" : "Create")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .tracking(-1)
                .foregroundStyle(.white)
                .contentTransition(.numericText())

            Text(mode == .signIn ? "Back." : "Account.")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .tracking(-1)
                .foregroundStyle(.white.opacity(0.85))
                .contentTransition(.numericText())

            Text(mode == .signIn ? "Sign in to track your money." : "Start planning your finances.")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(.white.opacity(0.75))
                .padding(.top, 2)
                .contentTransition(.opacity)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 28)
    }

    // MARK: - Form

    private var form: some View {
        VStack(spacing: 12) {
            if mode == .signUp {
                field("Name", text: $name, field: .name)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }

            field("Email", text: $email, field: .email)
            field("Password", text: $password, field: .password, secure: true)

            if let errorMessage {
                Text(errorMessage)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .glassEffect(.regular, in: .rect(cornerRadius: 16))
                    )
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }

            Button {
                submit()
            } label: {
                HStack(spacing: 8) {
                    if isLoading {
                        ProgressView()
                            .tint(Color(hex: 0x171717))
                    }
                    Text(mode == .signIn ? "Sign In" : "Register")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(Color(hex: 0x171717))
                }
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(Capsule().fill(.white))
                .shadow(color: .black.opacity(0.2), radius: 12, x: 0, y: 5)
            }
            .buttonStyle(SignInPressStyle())
            .disabled(isLoading || email.isEmpty || password.isEmpty)
            .opacity((isLoading || email.isEmpty || password.isEmpty) ? 0.6 : 1)
        }
        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: mode)
    }

    private func field(_ placeholder: String, text: Binding<String>, field: Field,
                       secure: Bool = false) -> some View {
        Group {
            if secure {
                SecureField(placeholder, text: text)
                    .textContentType(mode == .signIn ? .password : .newPassword)
            } else {
                TextField(placeholder, text: text)
                    .textContentType(field == .email ? .emailAddress : .name)
                    .textInputAutocapitalization(field == .email ? .never : .words)
                    .keyboardType(field == .email ? .emailAddress : .default)
                    .autocorrectionDisabled()
            }
        }
        .font(.system(size: 16))
        .foregroundStyle(Color(hex: 0x171717))
        .tint(.budgieBrand)
        .focused($focused, equals: field)
        .padding(.horizontal, 18)
        .frame(height: 54)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .glassEffect(.regular, in: .rect(cornerRadius: 20))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(focused == field ? Color.budgieBrand : Color(hex: 0x171717).opacity(0.12),
                        lineWidth: 1.5)
                .animation(.easeOut(duration: 0.2), value: focused == field)
        )
    }

    // MARK: - Footer

    private var footer: some View {
        HStack(spacing: 4) {
            Text(mode == .signUp ? "Already have an account?" : "Don't have an account?")
                .foregroundStyle(.white.opacity(0.8))
                .contentTransition(.opacity)
            Button(mode == .signUp ? "Sign In" : "Sign Up") {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                    mode = mode == .signIn ? .signUp : .signIn
                    errorMessage = nil
                }
            }
            .fontWeight(.semibold)
            .foregroundStyle(.white)
        }
        .font(.system(size: 14, weight: .regular))
        .buttonStyle(PlainButtonStyle())
    }

    // MARK: - Actions

    private func submit() {
        errorMessage = nil
        isLoading = true
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        Task {
            do {
                if mode == .signIn {
                    try await session.signIn(email: trimmedEmail, password: password)
                } else {
                    try await session.signUp(name: name.isEmpty ? "User" : name,
                                             email: trimmedEmail, password: password)
                }
            } catch {
                errorMessage = (error as? BudgieError)?.errorDescription
                    ?? (error as? LocalizedError)?.errorDescription
                    ?? "Something went wrong."
            }
            isLoading = false
        }
    }
}

struct SignInPressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.97)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

#Preview {
    SignInView()
        .environment(SessionStore.shared)
}