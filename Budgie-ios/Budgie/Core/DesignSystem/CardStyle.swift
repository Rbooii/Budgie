//
//  CardStyle.swift
//  Budgie
//
//  Shared flat card chrome: white fill, soft shadow, 20pt radius.
//

import SwiftUI

private struct BudgieCardModifier: ViewModifier {
    var radius: CGFloat

    func body(content: Content) -> some View {
        content
            .background(Color.budgieCard, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }
}

extension View {
    func budgieCard(radius: CGFloat = 20) -> some View {
        modifier(BudgieCardModifier(radius: radius))
    }
}
