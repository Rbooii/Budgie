//
//  BackButton.swift
//  Budgie
//
//  Created by Arco zakwan putra on 13/09/26.
//

import SwiftUI

struct BackButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: "chevron.left")
                .font(.system(size: 17, weight: .medium))
                .foregroundStyle(Color.budgieTextPrimary)
                .frame(width: 44, height: 44)
                .background(Color.budgieCard, in: Circle())
                .shadow(color: .black.opacity(0.12), radius: 8, y: 2)
        }
        .buttonStyle(PressableButtonStyle())
    }
}

#Preview {
    BackButton {}
        .padding(16)
        .background(Color.budgieBackground)
}
