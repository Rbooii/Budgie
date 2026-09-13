//
//  PlusPaymentWizard.swift
//  Budgie
//
//  Budgie Plus checkout: package -> QRIS scan (poll) -> success.
//

import SwiftUI
import UIKit
import CoreImage.CIFilterBuiltins

struct PlusPaymentWizard: View {
    var onCompleted: () -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var step: Step = .package
    @State private var checkout: CheckoutResult?
    @State private var isCheckingOut = false
    @State private var isSimulating = false
    @State private var errorMessage: String?
    @State private var expired = false
    @State private var remainingText = ""
    @State private var pollTask: Task<Void, Never>?

    private enum Step { case package, qr, success }

    var body: some View {
        Group {
            switch step {
            case .package: packageStep
            case .qr: qrStep
            case .success: successStep
            }
        }
        .background(Color.budgieScreen)
        .onAppear {
            #if DEBUG
            if DebugSeed.flowStep == 2 {
                checkoutPlus()
            } else if DebugSeed.flowStep == 3 {
                step = .success
            }
            #endif
        }
        .onDisappear { pollTask?.cancel() }
    }

    // MARK: - Package

    private var packageStep: some View {
        VStack(spacing: 0) {
            FlowHeader(title: "Budgie Plus", onClose: { dismiss() })

            ScrollView {
                VStack(spacing: 20) {
                    VStack(spacing: 6) {
                        Text("Rp 24.500")
                            .font(.system(size: 48, weight: .bold))
                            .monospacedDigit()
                            .tracking(-1.5)
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

                        Text("50% off your first month")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Color.budgieTextPrimary)
                            .padding(.top, 4)
                    }
                    .padding(.top, 16)

                    InsetCard {
                        InsetRow(label: "AI Financial Assistant", value: "Included")
                        Divider().overlay(Color.budgieHairline)
                        InsetRow(label: "All charts & insights", value: "Included")
                        Divider().overlay(Color.budgieHairline)
                        InsetRow(label: "PDF export", value: "Included")
                    }

                    Text("Then Rp 49.000 per month. Cancel anytime.")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.budgieTextSecondary)

                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }
                }
                .padding(.horizontal, 20)
            }

            CapsuleButton(title: "Continue to pay", isLoading: isCheckingOut, action: checkoutPlus)
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
        }
    }

    // MARK: - QR

    private var qrStep: some View {
        VStack(spacing: 0) {
            FlowHeader(title: "Scan to pay", onClose: { cancel() })

            ScrollView {
                VStack(spacing: 16) {
                    if expired {
                        expiredState
                    } else if let checkout {
                        Text("Rp 24.500 · Budgie Plus")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Color.budgieTextSecondary)

                        if let image = QRGenerator.image(from: checkout.qrString, size: 220) {
                            Image(uiImage: image)
                                .interpolation(.none)
                                .resizable()
                                .scaledToFit()
                                .frame(width: 220, height: 220)
                                .padding(14)
                                .background(Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                                        .stroke(Color.budgieChartPlaceholder, lineWidth: 1)
                                )
                        }

                        Text("Scan with your e-wallet")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.budgieTextSecondary)

                        HStack(spacing: 8) {
                            ProgressView().tint(.budgieBrand)
                            Text("Waiting for payment… \(remainingText)")
                                .font(.system(size: 13))
                                .monospacedDigit()
                                .foregroundStyle(Color.budgieTextTertiary)
                        }
                        .opacity(0.85)

                        if let errorMessage {
                            ErrorBanner(message: errorMessage)
                        }

                        Button {
                            simulate()
                        } label: {
                            ZStack {
                                Text("I've paid")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(Color.budgieTextPrimary)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 54)
                                    .background(Color.budgieSurfaceGray, in: Capsule())
                                if isSimulating {
                                    ProgressView().tint(.budgieTextPrimary)
                                }
                            }
                        }
                        .buttonStyle(PressableButtonStyle())
                        .disabled(isSimulating)
                        .padding(.top, 4)

                        Button {
                            cancel()
                        } label: {
                            Text("Cancel")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(Color.budgieTextSecondary)
                                .padding(.vertical, 8)
                        }
                        .buttonStyle(.plain)
                    } else {
                        ProgressView()
                            .padding(.vertical, 60)
                    }
                }
                .padding(20)
                .frame(maxWidth: .infinity)
            }
        }
    }

    private var expiredState: some View {
        VStack(spacing: 10) {
            Image(systemName: "qrcode")
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(Color.budgieTextTertiary)
                .padding(.bottom, 4)
            Text("Order expired")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)
            Text("The payment window has passed. Please start again.")
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
                .multilineTextAlignment(.center)

            CapsuleButton(title: "Start over") {
                withAnimation(.easeOut(duration: 0.2)) {
                    step = .package
                    expired = false
                    checkout = nil
                }
            }
            .padding(.top, 12)
        }
        .padding(.vertical, 40)
    }

    // MARK: - Success

    private var successStep: some View {
        SuccessView(
            title: "Welcome to Budgie Plus",
            onClose: { complete() },
            onDone: { complete() }
        ) {
            SuccessCard {
                ZStack {
                    Circle().fill(Color.budgieBrand.opacity(0.12))
                    Image(systemName: "sparkles")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(Color.budgieBrand)
                }
                .frame(width: 56, height: 56)

                InsetCard {
                    InsetRow(label: "Plan", value: "Budgie Plus")
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Price", value: "Rp 24.500 first month")
                    Divider().overlay(Color.budgieHairline)
                    InsetRow(label: "Status", value: "Active", valueColor: .budgieIncome)
                }
            }
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
                withAnimation(.easeOut(duration: 0.2)) { step = .qr }
                startPolling(expiresAt: result.expiresAt)
            } catch {
                errorMessage = (error as? BudgieError)?.errorDescription ?? "Something went wrong."
            }
            isCheckingOut = false
        }
    }

    private func startPolling(expiresAt: String) {
        guard let deadline = JSONCoding.date(from: expiresAt) else { return }
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
                            withAnimation(.easeOut(duration: 0.2)) { step = .success }
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
        let text = String(format: "· %02d:%02d", seconds / 60, seconds % 60)
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
                    withAnimation(.easeOut(duration: 0.2)) { step = .success }
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

    private func cancel() {
        pollTask?.cancel()
        dismiss()
    }

    private func complete() {
        pollTask?.cancel()
        onCompleted()
        dismiss()
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

#Preview {
    PlusPaymentWizard {}
}
