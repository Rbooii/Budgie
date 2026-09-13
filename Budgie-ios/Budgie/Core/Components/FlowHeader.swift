//
//  FlowHeader.swift
//  Budgie
//
//  Cash App-style flow header: green close button left, centered title.
//

import SwiftUI

struct FlowHeader: View {
    let title: String
    var subtitle: String?
    var onClose: () -> Void

    var body: some View {
        ZStack {
            VStack(spacing: 2) {
                Text(title)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                if let subtitle, !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.system(size: 13))
                        .foregroundStyle(Color.budgieTextSecondary)
                        .lineLimit(1)
                }
            }

            HStack {
                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(Color.budgieBrand)
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(PressableButtonStyle())
                Spacer()
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 8)
    }
}

#Preview {
    FlowHeader(title: "Add Account", subtitle: "BCA") {}
        .background(Color.budgieBackground)
}
