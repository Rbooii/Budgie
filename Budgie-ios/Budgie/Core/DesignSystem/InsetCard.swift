//
//  InsetCard.swift
//  Budgie
//
//  Grouped detail rows on a soft gray inset surface.
//

import SwiftUI

struct InsetRow: View {
    var label: String
    var value: String
    var valueColor: Color = .budgieTextPrimary

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
            Spacer(minLength: 12)
            Text(value)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(valueColor)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 12)
    }
}

struct InsetCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(spacing: 0) { content }
            .padding(.horizontal, 16)
            .background(Color.budgieSurfaceGray, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

#Preview {
    InsetCard {
        InsetRow(label: "Bank", value: "BCA")
        Divider().overlay(Color.budgieHairline)
        InsetRow(label: "Category", value: "Food & Drink")
        Divider().overlay(Color.budgieHairline)
        InsetRow(label: "Date", value: "13 Sep 2026")
    }
    .padding()
    .background(Color.budgieBackground)
}
