import SwiftUI

/// NFC card reader UI — scan button, status, record list with monospaced hex dump,
/// copy-to-clipboard. NDEF-only (works with free team accounts).
struct NFCScanSection: View {
    @State private var reader = NFCCardReader()
    @State private var copied = false

    var body: some View {
        VStack(spacing: 16) {
Text("Prepaid cards like e-Money, Flazz, and TapCash store their balance in a chip type that iPhones can't read. This reader works with cards and tags that expose standard card data — use Manual above to track those prepaid cards. Note: on free Apple developer accounts the system may still refuse card sessions.")
            .font(.system(size: 12))
            .foregroundStyle(Color.budgieTextTertiary)
            .fixedSize(horizontal: false, vertical: true)

            statusView

            Button {
                reader.startScan()
            } label: {
                Text(isScanning ? "Scanning…" : "Scan Card")
            }
            .buttonStyle(.budgieSuccess(height: 46, expanded: true))
            .disabled(isScanning || !reader.isReadingAvailable)

            if !reader.records.isEmpty {
                HStack(spacing: 10) {
                    Button {
                        copyAll()
                    } label: {
                        Text(copied ? "Copied!" : "Copy Hex Dump")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Color.budgieTextPrimary)
                            .padding(.horizontal, 18)
                            .frame(height: 40)
                            .background(Capsule().fill(Color.budgieSurfaceGray))
                    }
                    .buttonStyle(PlainButtonStyle())

                    Text("\(reader.records.count) record\(reader.records.count == 1 ? "" : "s")")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.budgieTextSecondary)
                    Spacer(minLength: 0)
                }
            }

            if !reader.records.isEmpty {
                List {
                    ForEach(reader.records) { record in
                        recordRow(record)
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }

            if case .success = reader.status, reader.records.isEmpty == false {
                Text("You can scan another card any time.")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.budgieTextFaint)
            }
        }
        .padding(20)
        .animation(.easeOut(duration: 0.25), value: reader.status)
        .animation(.easeOut(duration: 0.25), value: reader.records.count)
    }

    private var isScanning: Bool {
        if case .scanning = reader.status { return true }
        return false
    }

    // MARK: Status

    @ViewBuilder
    private var statusView: some View {
        switch reader.status {
        case .idle:
            HStack(spacing: 10) {
                ZStack {
                    Circle().fill(Color.budgieBrand.opacity(0.14))
                        .frame(width: 40, height: 40)
                    Image(systemName: "wave.3.right")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.budgieBrand)
                }
                Text("Ready to scan")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer(minLength: 0)
            }
        case .scanning:
            HStack(spacing: 12) {
                ProgressView()
                    .tint(.budgieBrand)
                Text("Hold your card near the top of your iPhone…")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer(minLength: 0)
            }
        case .success:
            HStack(spacing: 10) {
                ZStack {
                    Circle().fill(Color.budgieIncomePastel.opacity(0.4))
                        .frame(width: 40, height: 40)
                    Image(systemName: "checkmark")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Color.budgieIncome)
                }
                Text("Card detected")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer(minLength: 0)
            }
        case .error(let message):
            HStack(spacing: 10) {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.budgieExpense)
                Text(message)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.budgieExpense)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }
            .padding(12)
            .background(Color.budgieExpensePastel.opacity(0.45))
            .clipShape(.rect(cornerRadius: 16))
        }
    }

    // MARK: Record row

    private func recordRow(_ record: NFCNDEFRecord) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Record \(record.messageIndex + 1).\(record.recordIndex + 1)")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer(minLength: 0)
                Text(record.typeNameFormat)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Color.budgieTextSecondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(Color.budgieSurfaceGray))
            }

            if let text = record.payloadText, !text.isEmpty {
                Text(text)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.budgieTextPrimary)
                    .textSelection(.enabled)
            }

            Text(record.hexDump)
                .font(.system(size: 11, design: .monospaced))
                .foregroundStyle(Color.budgieTextSecondary)
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                UIPasteboard.general.string = record.hexDump
            } label: {
                Text("Copy")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.budgieBrand)
                    .padding(.horizontal, 12)
                    .frame(height: 28)
                    .background(Capsule().fill(Color.budgieIncomePastel.opacity(0.4)))
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.vertical, 6)
    }

    // MARK: Copy all

    private func copyAll() {
        let dump = reader.records.map(\.hexDump).joined(separator: "\n\n---\n\n")
        UIPasteboard.general.string = dump
        withAnimation(.easeOut(duration: 0.2)) { copied = true }
        Task {
            try? await Task.sleep(for: .seconds(1.5))
            withAnimation(.easeOut(duration: 0.2)) { copied = false }
        }
    }
}

#Preview {
    NFCScanSection()
}