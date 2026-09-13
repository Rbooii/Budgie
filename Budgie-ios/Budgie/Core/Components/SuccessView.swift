//
//  SuccessView.swift
//  Budgie
//
//  Cash App-style success screen: dark close top-right, green check,
//  big left-aligned title, summary card, Done CTA.
//

import SwiftUI

struct SuccessView<Card: View>: View {
    let title: String
    var onClose: () -> Void
    var onDone: () -> Void
    @ViewBuilder var card: Card

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Spacer()
                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(Color.budgieTextPrimary)
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(PressableButtonStyle())
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)

            ZStack {
                Circle().fill(Color.budgieBrand)
                Image(systemName: "checkmark")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(.white)
            }
            .frame(width: 64, height: 64)
            .padding(.horizontal, 24)
            .padding(.top, 20)

            Text(title)
                .font(.system(size: 30, weight: .semibold))
                .tracking(-0.5)
                .foregroundStyle(Color.budgieTextPrimary)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 24)
                .padding(.top, 20)

            Spacer(minLength: 20)

            card
                .padding(.horizontal, 20)

            Spacer(minLength: 20)

            CapsuleButton(title: "Done", action: onDone)
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
        }
        .background(Color.budgieScreen)
    }
}

struct SuccessCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(spacing: 16) { content }
            .padding(20)
            .frame(maxWidth: .infinity)
            .background(Color.budgieCard, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(Color.budgieChartPlaceholder, lineWidth: 1)
            )
    }
}

#Preview {
    SuccessView(title: "You added Rp 500.000 to BCA", onClose: {}, onDone: {}) {
        SuccessCard {
            ZStack {
                Circle().fill(Color.budgieBrand.opacity(0.12))
                Image(systemName: "building.columns")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(Color.budgieBrand)
            }
            .frame(width: 56, height: 56)

            InsetCard {
                InsetRow(label: "Type", value: "Bank")
                Divider().overlay(Color.budgieHairline)
                InsetRow(label: "Starting Balance", value: "Rp 500.000")
            }
        }
    }
}
