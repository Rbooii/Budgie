//
//  LandingView.swift
//  Budgie
//
//  Created by Arco zakwan putra on 13/09/26.
//

import SwiftUI

struct LandingView: View {
    @State private var isVisible = false

    private let rollingWords = ["Budgie", "Better Budgeting", "Smarter Saving"]

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Image("logo")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 90, height: 90)
                .opacity(isVisible ? 1 : 0)
                .scaleEffect(isVisible ? 1 : 0.8)
                .animation(.spring(response: 0.55, dampingFraction: 0.7), value: isVisible)

            VStack(alignment: .leading, spacing: 0) {
                Text("Welcome To")
                    .font(.system(size: 44))
                    .foregroundStyle(Color.budgieTextPrimary)
                    .entrance(isVisible, delay: 0.15)

                RollingText(words: rollingWords)
                    .entrance(isVisible, delay: 0.3)
            }

            Spacer()

            NavigationLink {
                LoginView()
            } label: {
                CapsuleLabel(title: "Get Started")
            }
            .buttonStyle(PressableButtonStyle())
            .entrance(isVisible, delay: 0.5)
        }
        .padding(.horizontal, 16)
        .padding(.top, 32)
        .padding(.bottom, 8)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color.budgieScreen)
        .onAppear { isVisible = true }
    }
}

#Preview {
    NavigationStack {
        LandingView()
    }
}
