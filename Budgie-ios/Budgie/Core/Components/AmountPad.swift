//
//  AmountPad.swift
//  Budgie
//
//  Cash App-style amount entry: close, title, huge amount, numeric keypad, CTA.
//

import SwiftUI

struct AmountPad: View {
    let title: String
    var subtitle: String?
    @Binding var raw: String
    var accent: Color = .budgieBrand
    var buttonTitle: String = "Add"
    var isLoading = false
    var isEnabled = true
    var errorMessage: String?
    var onClose: () -> Void
    var onSubmit: () -> Void

    private var amount: Double {
        Double(raw.isEmpty ? "0" : raw) ?? 0
    }

    var body: some View {
        VStack(spacing: 0) {
            FlowHeader(title: title, subtitle: subtitle, onClose: onClose)

            Spacer(minLength: 8)

            HStack(alignment: .lastTextBaseline, spacing: 6) {
                Text("Rp")
                    .font(.system(size: 32, weight: .bold))
                Text(formatNumber(amount))
                    .font(.system(size: 64, weight: .bold))
                    .tracking(-2)
            }
            .monospacedDigit()
            .foregroundStyle(accent)
            .lineLimit(1)
            .minimumScaleFactor(0.35)
            .padding(.horizontal, 24)

            Spacer(minLength: 8)

            NumericKeypad(raw: $raw)
                .padding(.horizontal, 32)

            if let errorMessage, !errorMessage.isEmpty {
                Text(errorMessage)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.budgieExpense)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
                    .padding(.top, 14)
            }

            CapsuleButton(
                title: buttonTitle,
                background: accent,
                isLoading: isLoading,
                isEnabled: isEnabled,
                action: onSubmit
            )
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 8)
        }
        .background(Color.budgieScreen)
    }
}

struct NumericKeypad: View {
    @Binding var raw: String

    private let rows: [[String]] = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["000", "0", "back"]
    ]

    var body: some View {
        VStack(spacing: 4) {
            ForEach(rows, id: \.self) { row in
                HStack(spacing: 4) {
                    ForEach(row, id: \.self) { key in
                        keyView(key)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func keyView(_ key: String) -> some View {
        if key == "back" {
            Button(action: backspace) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary.opacity(0.8))
                    .frame(maxWidth: .infinity)
                    .frame(height: 64)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .simultaneousGesture(
                LongPressGesture(minimumDuration: 0.45).onEnded { _ in raw = "" }
            )
        } else {
            Button {
                append(key)
            } label: {
                Text(key)
                    .font(.system(size: key == "000" ? 23 : 28, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary.opacity(0.8))
                    .frame(maxWidth: .infinity)
                    .frame(height: 64)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        }
    }

    private func append(_ key: String) {
        guard raw.count < 13 else { return }
        if key == "000" {
            guard !raw.isEmpty else { return }
            raw += key
        } else if raw == "0" {
            raw = key
        } else {
            raw += key
        }
    }

    private func backspace() {
        guard !raw.isEmpty else { return }
        raw.removeLast()
    }
}

#Preview {
    @Previewable @State var raw = "120000"
    AmountPad(
        title: "Add Expense",
        subtitle: "BCA",
        raw: $raw,
        accent: .budgieExpense,
        onClose: {},
        onSubmit: {}
    )
}
