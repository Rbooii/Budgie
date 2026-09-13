//
//  LoginView.swift
//  Budgie
//
//  Created by Arco zakwan putra on 13/09/26.
//

import SwiftUI

struct LoginView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(SessionStore.self) private var session

    @State private var email = ""
    @State private var password = ""
    @State private var isVisible = false
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            VStack(alignment: .leading, spacing: 0) {
                Spacer()

                Text("Sign in")
                    .font(.system(size: 44))
                    .foregroundStyle(Color.budgieTextPrimary)
                    .entrance(isVisible)

                VStack(spacing: 12) {
                    AuthTextField(
                        placeholder: "Email",
                        text: $email,
                        keyboardType: .emailAddress,
                        contentType: .emailAddress
                    )
                    .entrance(isVisible, delay: 0.15)

                    AuthTextField(
                        placeholder: "password",
                        text: $password,
                        isSecure: true,
                        contentType: .password
                    )
                    .entrance(isVisible, delay: 0.23)
                }
                .padding(.top, 44)

                VStack(spacing: 12) {
                    CapsuleButton(title: "Sign in", isLoading: isSubmitting) {
                        submit()
                    }

                    NavigationLink {
                        SignUpView()
                    } label: {
                        CapsuleLabel(title: "Sign up", background: .black)
                    }
                    .buttonStyle(PressableButtonStyle())

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.budgieExpense)
                            .multilineTextAlignment(.center)
                            .transition(.opacity)
                    }
                }
                .padding(.top, 28)
                .entrance(isVisible, delay: 0.35)

                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 48)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)

            BackButton { dismiss() }
                .padding(.leading, 16)
                .padding(.bottom, 8)
                .entrance(isVisible, delay: 0.5, offset: 12)
        }
        .background(Color.budgieScreen)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear { isVisible = true }
    }

    private func submit() {
        guard !isSubmitting else { return }
        isSubmitting = true
        withAnimation { errorMessage = nil }
        Task {
            do {
                try await session.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
            } catch {
                withAnimation {
                    errorMessage = (error as? BudgieError)?.errorDescription ?? "Something went wrong."
                }
            }
            isSubmitting = false
        }
    }
}

#Preview {
    NavigationStack {
        LoginView()
    }
    .environment(SessionStore.shared)
}
