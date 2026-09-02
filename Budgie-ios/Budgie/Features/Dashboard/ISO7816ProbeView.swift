import SwiftUI

/// ISO 7816 probe — developer tool: connect, run APDU commands, inspect the log.
/// Requires a paid Apple Developer membership (TAG entitlement) to run on device.
struct ISO7816ProbeView: View {
    @State private var reader = ISO7816Reader()
    @State private var commandHex = ""
    @State private var isSending = false

    private let presets: [(label: String, hex: String)] = [
        ("SELECT PPSE", "00 A4 04 00 0E 32 50 41 59 2E 53 59 53 2E 44 44 46 30 31 00"),
        ("SELECT PSE", "00 A4 04 00 0E 31 50 41 59 2E 53 59 53 2E 44 44 46 30 31 00"),
        ("SELECT MF", "00 A4 00 00 02 3F 00 00"),
        ("GET CHALLENGE", "00 84 00 00 08"),
        ("READ RECORD 1", "00 B2 01 04 00")
    ]

    var body: some View {
        VStack(spacing: 14) {
            notice

            statusView

            Button {
                if reader.isScanning {
                    reader.cancelScan()
                } else {
                    reader.startScan()
                }
            } label: {
                Text(buttonTitle)
            }
            .buttonStyle(.budgieSuccess(height: 46, expanded: true))
            .disabled(!reader.isReadingAvailable)

            if case .connected = reader.status {
                commandInput
            }

            if !reader.log.isEmpty {
                logList
            }
        }
        .padding(20)
        .animation(.easeOut(duration: 0.25), value: reader.status)
    }

    private var notice: some View {
        Text("ISO 7816 mode needs Apple's card-reader entitlement, which is only issued to paid Developer Program members. Free/personal teams (including this one) can't provision it, so this session won't run on your account. Bank cards also use proprietary AIDs and keys — this tool only exchanges raw APDUs for your own analysis.")
            .font(.system(size: 11))
            .foregroundStyle(Color.budgieTextTertiary)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var buttonTitle: String {
        if !reader.isReadingAvailable { return "NFC Unavailable" }
        switch reader.status {
        case .idle: return "Scan Card"
        case .scanning: return "Scanning…"
        case .connected: return "End Session"
        case .sending: return "Running Command…"
        case .error: return "Scan Again"
        }
    }

    @ViewBuilder
    private var statusView: some View {
        switch reader.status {
        case .idle:
            HStack(spacing: 10) {
                Text("Ready to scan")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer(minLength: 0)
            }
        case .scanning:
            HStack(spacing: 12) {
                ProgressView().tint(.budgieBrand)
                Text("Hold your card near the top of your iPhone…")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer(minLength: 0)
            }
        case .connected:
            HStack(spacing: 10) {
                ZStack {
                    Circle().fill(Color.budgieIncomePastel.opacity(0.4))
                        .frame(width: 36, height: 36)
                    Image(systemName: "checkmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color.budgieIncome)
                }
                Text("Connected · \(reader.tagIdentifier ?? "ISO 7816 tag")")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.budgieTextPrimary)
                    .lineLimit(1)
                Spacer(minLength: 0)
            }
        case .sending:
            HStack(spacing: 12) {
                ProgressView().tint(.budgieBrand)
                Text("Exchanging APDU…")
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

    // MARK: Command input

    private var commandInput: some View {
        VStack(spacing: 10) {
            HStack(spacing: 6) {
                ForEach(presets, id: \.hex) { preset in
                    Button {
                        commandHex = preset.hex
                    } label: {
                        Text(preset.label)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Color.budgieTextPrimary)
                            .padding(.horizontal, 10)
                            .frame(height: 30)
                            .background(Capsule().fill(Color.budgieSurfaceGray))
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 8) {
                TextField("Command hex — e.g. 00 A4 04 00 07 D2 76 00 00 85 01 01", text: $commandHex)
                    .font(.system(size: 13, design: .monospaced))
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .padding(.horizontal, 12)
                    .frame(height: 42)
                    .background(Color.budgieInsetSurface)
                    .clipShape(.rect(cornerRadius: 14))

                Button {
                    sendCommand()
                } label: {
                    Image(systemName: "arrow.up")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 38, height: 38)
                        .background(Circle().fill(Color.budgieBrand))
                }
                .buttonStyle(PlainButtonStyle())
                .disabled(isSending)
            }
        }
    }

    private func sendCommand() {
        guard let apduData = Hex.data(from: commandHex), apduData.count >= 4 else { return }
        let apdu = APDU(cla: apduData[0], ins: apduData[1], p1: apduData[2], p2: apduData[3],
                        data: apduData.count > 4 ? apduData.subdata(in: 4..<apduData.count) : Data(),
                        le: nil)
        isSending = true
        Task {
            do {
                _ = try await reader.send(apdu)
            } catch {
                reader.log.append(ISO7816Reader.ExchangeLog(
                    command: apdu.hex, response: "", sw: "",
                    status: error.localizedDescription, ok: false))
            }
            isSending = false
        }
    }

    // MARK: Log

    private var logList: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("APDU Log")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer()
                Button {
                    UIPasteboard.general.string = reader.log.map {
                        "\($0.command)\n→ \($0.response) [\($0.sw)] \($0.status)"
                    }.joined(separator: "\n\n")
                } label: {
                    Text("Copy")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Color.budgieBrand)
                }
                .buttonStyle(PlainButtonStyle())
            }

            ScrollView {
                VStack(spacing: 8) {
                    ForEach(reader.log) { entry in
                        VStack(alignment: .leading, spacing: 3) {
                            if !entry.command.isEmpty {
                                Text(entry.command)
                                    .font(.system(size: 12, design: .monospaced))
                                    .foregroundStyle(Color.budgieTextPrimary)
                            } else {
                                Text(entry.response)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(Color.budgieTextPrimary)
                            }
                            if !entry.response.isEmpty && !entry.sw.isEmpty {
                                HStack(spacing: 6) {
                                    Text("→ \(entry.response)")
                                        .font(.system(size: 12, design: .monospaced))
                                        .foregroundStyle(Color.budgieTextSecondary)
                                    Text("[\(entry.sw)] \(entry.status)")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundStyle(entry.ok ? Color.budgieIncome : Color.budgieExpense)
                                }
                            } else if !entry.sw.isEmpty {
                                Text("[\(entry.sw)] \(entry.status)")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(entry.ok ? Color.budgieIncome : Color.budgieExpense)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(Color.budgieInsetSurface)
                        .clipShape(.rect(cornerRadius: 12))
                    }
                }
            }
            .frame(maxHeight: 260)
        }
    }
}

#Preview {
    ISO7816ProbeView()
}