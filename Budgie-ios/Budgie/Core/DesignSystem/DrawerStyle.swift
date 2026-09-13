//
//  DrawerStyle.swift
//  Budgie
//
//  Bottom-sheet "drawer" chrome: Liquid Glass background, rounded top corners,
//  drag indicator.
//

import SwiftUI

extension View {
    func budgieDrawer() -> some View {
        self
            .presentationBackground(.clear)
            .presentationCornerRadius(28)
            .presentationDragIndicator(.visible)
            .glassEffect(.regular, in: .rect(cornerRadius: 28))
    }
}
