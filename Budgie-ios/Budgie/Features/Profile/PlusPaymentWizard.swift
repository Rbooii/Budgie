import SwiftUI
import CoreImage.CIFilterBuiltins

struct PlusPaymentWizard: View {
    var onCompleted: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var step = 1
    @State private var checkout: CheckoutResult?
    @State private var isCheckingOut = false
    @State private var isSimulating = false
    @State private var errorMessage: String?
    @State private var expired = false
    @State private var remainingText = ""
    @State private var pollTask: Task<Void, Never>?

    var body: some View {
        VStack(spacing: 0) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(Color.budgieHairlineTrack)
                    Rectangle()
                        .fill(Color.budgieBrand)
                        .frame(width: geo.size.width * CGFloat(step) / 3)
                }
            }
            .frame(height: 2)

            topBar

            Group {
                switch step {
                case 1: packageStep
                case 2: qrStep
                default: successStep
                }
            }
            .transition(.wizardStep)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .presentationBackground(Color(.systemBackground))
        .onDisappear { pollTask?.cancel() }
    }

    private var topBar: some View {
        HStack {
            if step > 1 && step < 3 {
                Button {
                    pollTask?.cancel()
                    withAnimation(.easeOut(duration: 0.2)) { step -= 1 }
                } label: {
                    Image(systemName: SFIcons.chevronLeft)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.budgieTextPrimary)
                }
                .buttonStyle(PlainButtonStyle())
            }
            Spacer()
            Text("\(step) of 3")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.budgieTextSecondary)
            Spacer()
            if step < 3 {
                Button {
                    pollTask?.cancel()
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
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
    }

    // MARK: Step 1 — Package

    private var packageStep: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(spacing: 8) {
                    Text("Budgie Plus")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(Color.budgieTextPrimary)
                    Text("50% off your first month")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.budgieTextSecondary)
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("Rp 24.500")
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(Color.budgieBrand)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    HStack(spacing: 8) {
                        Text("Rp 49.000")
                            .font(.system(size: 16, weight: .medium))
                            .monospacedDigit()
                            .foregroundStyle(Color.budgieTextTertiary)
                            .strikethrough()
                        Text("/month")
                            .font(.system(size: 14))
                            .foregroundStyle(Color.budgieTextSecondary)
                    }
                    Text("Then Rp 49.000 per month. Cancel anytime.")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.budgieTextSecondary)

                    InsetCard {
                        InsetRow(label: "AI Financial Assistant", value: "Included")
                        Divider().overlay(Color.budgieHairline)
                        InsetRow(label: "All charts & insights", value: "Included")
                        Divider().overlay(Color.budgieHairline)
                        InsetRow(label: "PDF export", value: "Included")
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                Button {
                    checkoutPlus()
                } label: {
                    Text("Continue to pay")
                }
                .buttonStyle(.budgieSuccess(height: 48, isLoading: isCheckingOut, expanded: true))
            }
            .padding(20)
        }
    }

    // MARK: Step 2 — QR

    private var qrStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                if expired {
                    EmptyStateView(icon: SFIcons.qr, title: "Order expired",
                                   message: "The payment window has passed. Please start again.")
                    Button {
                        withAnimation(.easeOut(duration: 0.2)) {
                            step = 1
                            expired = false
                            checkout = nil
                        }
                    } label: {
                        Text("Start over")
                    }
                    .buttonStyle(.budgieSuccess(height: 46))
                } else if let checkout {
                    Text("Scan to pay")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(Color.budgieTextPrimary)
                    Text("Rp 24.500 · Budgie Plus")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.budgieTextSecondary)

                    if let image = QRGenerator.image(from: checkout.qrString, size: 220) {
                        Image(uiImage: image)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 220, height: 220)
                            .padding(14)
                            .background(Color.white)
                            .clipShape(.rect(cornerRadius: 20))
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.budgieHairline, lineWidth: 1))
                            .softPulse(duration: 1.2)
                    }

                    Text("Scan with your e-wallet")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color.budgieTextSecondary)

                    HStack(spacing: 8) {
                        ProgressView()
                            .tint(.budgieBrand)
                        Text("Waiting for payment… \(remainingText)")
                            .font(.system(size: 13))
                            .foregroundStyle(Color.budgieTextTertiary)
                    }
                    .opacity(0.85)

                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }

                    Button {
                        simulate()
                    } label: {
                        Text("I've paid")
                    }
                    .buttonStyle(.budgieOutline(height: 46, isLoading: isSimulating))

                    Button {
                        pollTask?.cancel()
                        dismiss()
                    } label: {
                        Text("Cancel")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.budgieTextSecondary)
                    }
                    .buttonStyle(PlainButtonStyle())
                } else {
                    ProgressView().padding(.vertical, 60)
                }
            }
            .padding(20)
        }
    }

    // MARK: Step 3 — Success

    private var successStep: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text("Welcome to Budgie Plus")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(Color.budgieTextPrimary)
                Text("All Plus features are now unlocked. Enjoy!")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.budgieTextSecondary)
                    .multilineTextAlignment(.center)

                Button {
                    onCompleted()
                    dismiss()
                } label: {
                    Text("Done")
                }
                .buttonStyle(.budgieSuccess(height: 46))
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    // MARK: - Logic

    private func checkoutPlus() {
        isCheckingOut = true
        errorMessage = nil
        Task {
            do {
                let result = try await RESTAPI.checkoutPlus()
                checkout = result
                expired = false
                remainingText = ""
                withAnimation(.easeOut(duration: 0.2)) { step = 2 }
                startPolling(expiresAt: result.expiresAt)
            } catch let error as BudgieError {
                errorMessage = error.errorDescription
            } catch {
                errorMessage = "Something went wrong."
            }
            isCheckingOut = false
        }
    }

    private func startPolling(expiresAt: String) {
        guard let deadline = DateFormatters.iso.date(from: expiresAt)
            ?? DateFormatters.isoNoFraction.date(from: expiresAt) else { return }
        pollTask?.cancel()
        pollTask = Task {
            while !Task.isCancelled {
                updateRemaining(deadline: deadline)
                if Date() > deadline {
                    await MainActor.run { expired = true }
                    return
                }
                try? await Task.sleep(for: .seconds(3))
                guard let orderId = checkout?.orderId, !Task.isCancelled else { return }
                do {
                    let status = try await RESTAPI.plusStatus(orderId: orderId)
                    if status.transactionStatus == "settlement" || status.transactionStatus == "capture" {
                        await MainActor.run {
                            withAnimation(.easeOut(duration: 0.2)) { step = 3 }
                        }
                        return
                    }
                } catch let error as BudgieError {
                    if case .notFound = error {
                        await MainActor.run { expired = true }
                        return
                    }
                } catch {
                    // transient network error — keep polling
                }
            }
        }
    }

    private func updateRemaining(deadline: Date) {
        let seconds = max(Int(deadline.timeIntervalSinceNow), 0)
        let minutes = seconds / 60
        let secs = seconds % 60
        let text = String(format: "· %02d:%02d", minutes, secs)
        if text != remainingText {
            remainingText = text
        }
    }

    private func simulate() {
        guard let orderId = checkout?.orderId else { return }
        isSimulating = true
        errorMessage = nil
        Task {
            do {
                let status = try await RESTAPI.simulatePayment(orderId: orderId)
                if status.transactionStatus == "settlement" || status.transactionStatus == "capture" {
                    pollTask?.cancel()
                    withAnimation(.easeOut(duration: 0.2)) { step = 3 }
                } else {
                    errorMessage = "Payment not confirmed yet. Try again in a moment."
                }
            } catch let error as BudgieError {
                if case .notFound = error {
                    expired = true
                } else {
                    errorMessage = error.errorDescription
                }
            } catch {
                errorMessage = "Something went wrong."
            }
            isSimulating = false
        }
    }
}

// MARK: - QR code generation (CoreImage)

enum QRGenerator {
    static func image(from string: String, size: CGFloat) -> UIImage? {
        let filter = CIFilter(name: "CIQRCodeGenerator")
        filter?.setValue(Data(string.utf8), forKey: "inputMessage")
        filter?.setValue("M", forKey: "inputCorrectionLevel")
        guard let output = filter?.outputImage else { return nil }
        let scale = size / output.extent.width
        let scaled = output.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
        let context = CIContext()
        guard let cgImage = context.createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}