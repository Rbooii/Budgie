//
//  CapsuleLabel.swift
//  Budgie
//

import SwiftUI

struct CapsuleLabel: View {
    let title: String
    var background: Color = .budgieBrand

    var body: some View {
        Text(title)
            .font(.headline)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(background, in: Capsule())
    }
}

#Preview {
    VStack(spacing: 12) {
        CapsuleLabel(title: "Sign in")
        CapsuleLabel(title: "Sign up", background: .black)
    }
    .padding(.horizontal, 16)
}
