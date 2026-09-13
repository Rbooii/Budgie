//
//  CapsuleButton.swift
//  Budgie
//

import SwiftUI

struct CapsuleButton: View {
    let title: String
    var background: Color = .budgieBrand
    var isLoading = false
    var isEnabled = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                CapsuleLabel(title: title, background: background)
                    .opacity(isLoading ? 0 : 1)
                if isLoading {
                    ProgressView()
                        .tint(.white)
                }
            }
            .opacity(isEnabled ? 1 : 0.5)
        }
        .disabled(!isEnabled || isLoading)
        .buttonStyle(PressableButtonStyle())
    }
}

struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

#Preview {
    VStack(spacing: 12) {
        CapsuleButton(title: "Sign in") {}
        CapsuleButton(title: "Sign up", background: .black) {}
        CapsuleButton(title: "Loading", isLoading: true) {}
    }
    .padding(.horizontal, 16)
}
