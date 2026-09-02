import SwiftUI

// MARK: - E-money providers (e-Money / Flazz / TapCash)

struct EMoneyProvider: Identifiable {
    let name: String
    let issuer: String
    let color: Color

    var id: String { name }

    static let all: [EMoneyProvider] = [
        EMoneyProvider(name: "e-Money", issuer: "Mandiri", color: Color(hex: 0x0A84FF)),
        EMoneyProvider(name: "Flazz", issuer: "BCA", color: Color(hex: 0xE11D48)),
        EMoneyProvider(name: "TapCash", issuer: "BNI", color: Color(hex: 0xF59E0B))
    ]
}

// MARK: - Scan sheet (mock scan + manual entry)

struct EMoneyScannerView: View {
    var onSaved: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var step = 1
    @State private var provider: EMoneyProvider?
    @State private var showManual = false
    @State private var cardNumber = ""
    @State private var balanceInput = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var scanning = false
    @State private var mode: Mode = .manual
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    enum Mode: String, CaseIterable, Hashable {
        case manual = "Manual"
        case nfc = "NFC Reader"
        case iso = "ISO 7816"
    }

    private var lastFour: String {
        let digits = cardNumber.filter(\.isNumber)
        return digits.count >= 4 ? String(digits.suffix(4)) : digits
    }

    private var accountName: String {
        let base = provider?.name ?? "E-Money"
        return lastFour.isEmpty ? base : "\(base) ••\(lastFour)"
    }

    var body: some View {
        VStack(spacing: 0) {
            if mode == .manual {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Rectangle().fill(Color.budgieHairlineTrack)
                        Rectangle()
                            .fill(Color.budgieBrand)
                            .frame(width: geo.size.width * CGFloat(step) / 2)
                    }
                }
                .frame(height: 2)
            }

            topBar

            modePicker
                .padding(.horizontal, 20)
                .padding(.bottom, 4)

            Group {
                if mode == .nfc {
                    NFCScanSection()
                        .transition(.opacity)
                } else if mode == .iso {
                    ISO7816ProbeView()
                        .transition(.opacity)
                } else {
                    switch step {
                    case 1: providerStep
                    default: scanStep
                    }
                }
            }
            .transition(.wizardStep)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .presentationBackground(Color(.systemBackground))
    }

    private var modePicker: some View {
        VStack(spacing: 8) {
            HStack(spacing: 4) {
                ForEach(availableModes, id: \.self) { m in
                    Button {
                        withAnimation(.easeOut(duration: 0.2)) {
                            mode = m
                            errorMessage = nil
                        }
                    } label: {
                        Text(m.rawValue)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(mode == m ? Color.budgieTextPrimary : Color.budgieTextSecondary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 32)
                            .background(
                                Capsule().fill(mode == m ? Color.budgieSurfaceGray : Color.clear)
                            )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(4)
            .background(Capsule().fill(Color.budgieInsetSurface))

            if !NFCFeatureGate.cardReaderEnabled {
                Text("Card reading (NFC) needs a paid Apple Developer account — it's disabled on this build. Use Manual to track e-money cards.")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.budgieTextTertiary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var availableModes: [Mode] {
        Mode.allCases.filter { $0 == .manual || NFCFeatureGate.cardReaderEnabled }
    }

    private var topBar: some View {
        HStack {
            if mode == .manual && step > 1 {
                Button {
                    withAnimation(.easeOut(duration: 0.2)) { step -= 1 }
                } label: {
                    Image(systemName: SFIcons.chevronLeft)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.budgieTextPrimary)
                }
                .buttonStyle(PlainButtonStyle())
            }
            Spacer()
            Text(mode == .manual ? "\(step) of 2" : (mode == .nfc ? "Card Reader" : "ISO 7816"))
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.budgieTextSecondary)
            Spacer()
            Button {
                dismiss()
            } label: {
                Image(systemName: SFIcons.close)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.budgieTextSecondary)
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(Color.budgieSurfaceGray))
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
    }

    // MARK: Step 1 — Provider

    private var providerStep: some View {
        ScrollView {
            VStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Scan e-money")
                        .font(.system(size: 22, weight: .bold))
                        .tracking(-0.3)
                        .foregroundStyle(Color.budgieTextPrimary)
                    Text("Choose your card provider.")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.budgieTextSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                ForEach(EMoneyProvider.all) { p in
                    Button {
                        withAnimation(.easeOut(duration: 0.15)) { provider = p }
                    } label: {
                        HStack(spacing: 14) {
                            ZStack {
                                Circle().fill(p.color.opacity(0.16))
                                    .frame(width: 48, height: 48)
                                Image(systemName: "wave.3.right")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundStyle(p.color)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(p.name)
                                    .font(.system(size: 17, weight: .semibold))
                                    .foregroundStyle(Color.budgieTextPrimary)
                                Text(p.issuer)
                                    .font(.system(size: 13))
                                    .foregroundStyle(Color.budgieTextSecondary)
                            }
                            Spacer()
                            if provider?.id == p.id {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 22))
                                    .foregroundStyle(Color.budgieBrand)
                            }
                        }
                        .padding(14)
                        .background(provider?.id == p.id ? p.color.opacity(0.08) : Color.budgieCard)
                        .clipShape(.rect(cornerRadius: 20))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(provider?.id == p.id ? p.color.opacity(0.5) : Color.budgieHairline, lineWidth: 1.5)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }

                Text("e-Money, Flazz, and TapCash use a card chip that iPhones can't read directly, so you'll enter the card number and balance manually.")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.budgieTextTertiary)
                    .fixedSize(horizontal: false, vertical: true)

                Button {
                    withAnimation(.easeOut(duration: 0.2)) {
                        showManual = false
                        step = 2
                    }
                } label: {
                    Text("Continue")
                }
                .buttonStyle(.budgieSuccess(height: 46, expanded: true))
                .disabled(provider == nil)
            }
            .padding(20)
        }
    }

    // MARK: Step 2 — Scan + manual entry

    private var scanStep: some View {
        ScrollView {
            VStack(spacing: 18) {
                scanVisual
                    .padding(.top, 8)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Scan \(provider?.name ?? "card")")
                        .font(.system(size: 20, weight: .bold))
                        .tracking(-0.3)
                        .foregroundStyle(Color.budgieTextPrimary)
                    Text("Hold your card near the top of your iPhone, or enter the details below.")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.budgieTextSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if !showManual {
                    Button {
                        withAnimation(.easeOut(duration: 0.2)) { showManual = true }
                    } label: {
                        Text("Enter manually")
                    }
                    .buttonStyle(.budgieOutline(height: 44))
                }

                if showManual {
                    manualForm
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                if showManual {
                    Button {
                        save()
                    } label: {
                        Text("Save Card")
                    }
                    .buttonStyle(.budgieSuccess(isLoading: isSaving, expanded: true))
                    .disabled(lastFour.isEmpty || parseBalanceInput(balanceInput) < 0 || isSaving)
                }
            }
            .padding(20)
        }
    }

    private var scanVisual: some View {
        ZStack {
            let color = provider?.color ?? Color.budgieBrand
            Circle()
                .stroke(color.opacity(0.25), lineWidth: 2)
                .frame(width: 168, height: 168)
                .scaleEffect(scanning ? 1.35 : 0.9)
                .opacity(scanning ? 0 : 0.9)
            Circle()
                .stroke(color.opacity(0.35), lineWidth: 2)
                .frame(width: 136, height: 136)
                .scaleEffect(scanning ? 1.3 : 0.95)
                .opacity(scanning ? 0 : 1)
            ZStack {
                Circle().fill(color.opacity(0.14))
                    .frame(width: 92, height: 92)
                Image(systemName: "wave.3.right")
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundStyle(color)
            }
        }
        .frame(height: 180)
        .onAppear {
            guard !reduceMotion else { return }
            scanning = true
        }
        .animation(scanning ? .easeOut(duration: 1.6).repeatForever(autoreverses: false) : nil,
                   value: scanning)
    }

    private var manualForm: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Card number")
                    .font(.system(size: 15))
                    .foregroundStyle(Color.budgieTextSecondary)
                Spacer()
                TextField("1234 5678 9012 4821", text: $cardNumber)
                    .font(.system(size: 15, weight: .medium))
                    .monospacedDigit()
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.trailing)
                    .frame(width: 170)
                    .onChange(of: cardNumber) { _, newValue in
                        cardNumber = formatCardNumber(newValue)
                    }
            }
            .padding(.vertical, 12)
            Divider().overlay(Color.budgieHairline)
            HStack {
                Text("Balance")
                    .font(.system(size: 15))
                    .foregroundStyle(Color.budgieTextSecondary)
                Spacer()
                HStack(spacing: 2) {
                    Text("Rp")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color.budgieTextTertiary)
                    TextField("0", text: $balanceInput)
                        .font(.system(size: 15, weight: .semibold))
                        .monospacedDigit()
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 120)
                        .onChange(of: balanceInput) { _, newValue in
                            balanceInput = formatBalanceInput(newValue)
                        }
                }
            }
            .padding(.vertical, 12)
        }
        .padding(.horizontal, 16)
        .background(Color.budgieInsetSurface)
        .clipShape(.rect(cornerRadius: 20))
    }

    // MARK: - Logic

    private func formatCardNumber(_ raw: String) -> String {
        let digits = raw.filter(\.isNumber).prefix(16)
        return stride(from: 0, to: digits.count, by: 4).map { offset in
            let start = digits.index(digits.startIndex, offsetBy: offset)
            let end = digits.index(start, offsetBy: min(4, digits.count - offset))
            return String(digits[start..<end])
        }.joined(separator: " ")
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        let balance = parseBalanceInput(balanceInput)
        Task {
            do {
                _ = try await RESTAPI.createAccount(name: accountName, balance: balance,
                                                    currency: "IDR", type: "emoney")
                onSaved()
                dismiss()
            } catch let error as BudgieError {
                errorMessage = error.errorDescription
            } catch {
                errorMessage = "Something went wrong."
            }
            isSaving = false
        }
    }
}