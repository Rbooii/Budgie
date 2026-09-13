//
//  ErrorBanner.swift
//  Budgie
//

import SwiftUI

struct ErrorBanner: View {
    var message: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 13, weight: .semibold))
            Text(message)
                .font(.system(size: 13, weight: .medium))
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(Color.budgieExpense)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.budgieExpense.opacity(0.12), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

#Preview {
    ErrorBanner(message: "Insufficient balance")
        .padding()
        .background(Color.budgieBackground)
}
