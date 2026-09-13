//
//  SignUpView.swift
//  Budgie
//
//  Created by Arco zakwan putra on 13/09/26.
//

import SwiftUI

struct SignUpView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(SessionStore.self) private var session

    @State private var nickname = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isVisible = false
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            VStack(alignment: .leading, spacing: 0) {
                Spacer()

                Text("Sign Up")
                    .font(.system(size: 44))
                    .foregroundStyle(Color.budgieTextPrimary)
                    .entrance(isVisible)

                VStack(spacing: 12) {
                    AuthTextField(
                        placeholder: "Nickname",
                        text: $nickname,
                        autocapitalization: .words,
                        contentType: .nickname
                    )
                    .entrance(isVisible, delay: 0.15)

                    AuthTextField(
                        placeholder: "Email",
                        text: $email,
                        keyboardType: .emailAddress,
                        contentType: .emailAddress
                    )
                    .entrance(isVisible, delay: 0.23)

                    AuthTextField(
                        placeholder: "password",
                        text: $password,
                        isSecure: true,
                        contentType: .newPassword
                    )
                    .entrance(isVisible, delay: 0.31)
                }
                .padding(.top, 44)

                VStack(spacing: 12) {
                    CapsuleButton(title: "Sign up", isLoading: isSubmitting) {
                        submit()
                    }

                    CapsuleButton(title: "Sign in", background: .black) {
                        dismiss()
                    }

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.budgieExpense)
                            .multilineTextAlignment(.center)
                            .transition(.opacity)
                    }
                }
                .padding(.top, 28)
                .entrance(isVisible, delay: 0.42)

                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 48)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)

            BackButton { dismiss() }
                .padding(.leading, 16)
                .padding(.bottom, 8)
                .entrance(isVisible, delay: 0.55, offset: 12)
        }
        .background(Color.budgieScreen)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear { isVisible = true }
    }

    private func submit() {
        guard !isSubmitting else { return }
        let name = nickname.trimmingCharacters(in: .whitespaces)
        isSubmitting = true
        withAnimation { errorMessage = nil }
        Task {
            do {
                try await session.signUp(
                    name: name.isEmpty ? "User" : name,
                    email: email.trimmingCharacters(in: .whitespaces),
                    password: password
                )
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
        SignUpView()
    }
    .environment(SessionStore.shared)
}
