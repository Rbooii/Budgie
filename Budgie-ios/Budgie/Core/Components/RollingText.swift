//
//  RollingText.swift
//  Budgie
//
//  Created by Arco zakwan putra on 13/09/26.
//

import SwiftUI

struct RollingText: View {
    let words: [String]
    var size: CGFloat = 44
    var interval: Duration = .seconds(2.4)

    @State private var index = 0

    var body: some View {
        ZStack(alignment: .leading) {
            Text(words[index])
                .font(.system(size: size))
                .foregroundStyle(Color.budgieTextPrimary)
                .id(index)
                .transition(
                    .asymmetric(
                        insertion: .move(edge: .bottom).combined(with: .opacity),
                        removal: .move(edge: .top).combined(with: .opacity)
                    )
                )
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: size * 1.3)
        .clipped()
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(for: interval)
                guard !Task.isCancelled else { break }
                withAnimation(.spring(response: 0.55, dampingFraction: 0.85)) {
                    index = (index + 1) % words.count
                }
            }
        }
    }
}

#Preview {
    RollingText(words: ["Budgie", "Better Budgeting", "Smarter Saving"])
        .padding(.horizontal, 16)
}
