//
//  View+Entrance.swift
//  Budgie
//
//  Created by Arco zakwan putra on 13/09/26.
//

import SwiftUI

extension View {
    func entrance(_ isVisible: Bool, delay: Double = 0, offset: CGFloat = 24) -> some View {
        self
            .opacity(isVisible ? 1 : 0)
            .offset(y: isVisible ? 0 : offset)
            .animation(.spring(response: 0.6, dampingFraction: 0.8).delay(delay), value: isVisible)
    }
}
