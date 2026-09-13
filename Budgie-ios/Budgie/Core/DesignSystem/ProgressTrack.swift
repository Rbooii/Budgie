//
//  ProgressTrack.swift
//  Budgie
//
//  Capsule progress bar (green under budget, red over).
//

import SwiftUI

struct ProgressTrack: View {
    var progress: Double
    var isOver = false
    var height: CGFloat = 8
    var trackColor: Color = .budgieHairlineTrack
    var fillColor: Color?

    private var clamped: Double {
        min(max(progress, 0), 1)
    }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(trackColor)
                Capsule()
                    .fill(fillColor ?? (isOver ? Color.budgieExpense : Color.budgieBrand))
                    .frame(width: max(geo.size.width * clamped, clamped > 0 ? height : 0))
            }
        }
        .frame(height: height)
        .animation(.easeOut(duration: 0.3), value: clamped)
    }
}

#Preview {
    VStack(spacing: 16) {
        ProgressTrack(progress: 0.42)
        ProgressTrack(progress: 1.3, isOver: true)
        ProgressTrack(progress: 0.7, trackColor: .white.opacity(0.25), fillColor: .white)
    }
    .padding()
    .background(Color.budgieBackground)
}
