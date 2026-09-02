import CoreNFC
import Foundation
import SwiftUI

// MARK: - ISO 7816 / ISO 14443-4 smart-card reader
//
// ⚠️ RUN-TIME REQUIREMENT
// `NFCTagReaderSession` needs the "TAG" value inside
// `com.apple.developer.nfc.readersession.formats`. Apple only issues that
// capability to paid (or business) Apple Developer Program members — free /
// personal teams will fail at provisioning. This code compiles and is ready
// to run once a paid account adds the capability; do NOT put "TAG" into
// Budgie.entitlements while signing with a free team (build will fail).
//
// Testing must happen on a physical iPhone — the Simulator has no NFC.

@MainActor
@Observable
final class ISO7816Reader: NSObject, NFCTagReaderSessionDelegate {

    struct ExchangeLog: Identifiable {
        let id = UUID()
        let command: String
        let response: String
        let sw: String
        let status: String
        let ok: Bool
        let date = Date()
    }

    enum Status: Equatable {
        case idle
        case scanning
        case connected
        case sending
        case error(String)
    }

    var status: Status = .idle
    var log: [ExchangeLog] = []
    var tagIdentifier: String?
    var initialSelectedAID: String?

    var isReadingAvailable: Bool { NFCTagReaderSession.readingAvailable }

    /// True while a session is active (scanning/connected/sending).
    var isScanning: Bool {
        switch status {
        case .scanning, .connected, .sending: return true
        default: return false
        }
    }

    private var session: NFCTagReaderSession?
    private var isoTag: NFCISO7816Tag?

    // MARK: - Scan lifecycle (one session per tap)

    func startScan() {
        guard isReadingAvailable else {
            status = .error("This iPhone doesn't support card reading.")
            return
        }
        guard !isScanning else { return }

        log = []
        tagIdentifier = nil
        initialSelectedAID = nil
        status = .scanning

        // iOS 26.4+ configuration API: ISO 14443-4 polling (APDU-capable smart cards).
        // `iso7816SelectIdentifiers` (optional) lists candidate AIDs Apple may
        // auto-select on discovery; leave empty for manual probing.
        let configuration = NFCTagReaderSession.Configuration(pollingOption: .iso14443)
        let newSession = NFCTagReaderSession(configuration: configuration, delegate: self, queue: nil)
        newSession.alertMessage = "Hold your card near the top of your iPhone."
        session = newSession
        newSession.begin()
    }

    func cancelScan() {
        session?.invalidate()
    }

    // MARK: - NFCTagReaderSessionDelegate

    nonisolated func tagReaderSessionDidBecomeActive(_ session: NFCTagReaderSession) {
        // Session is up; nothing to do — the system UI handles the alert.
    }

    nonisolated func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
        guard let tag = tags.first else {
            session.invalidate(errorMessage: "No card detected. Try again.")
            return
        }
        Task { @MainActor in
            await self.connect(tag)
        }
    }

    nonisolated func tagReaderSessionDidEnd(_ session: NFCTagReaderSession) {
        Task { @MainActor in
            if case .scanning = self.status {
                self.status = .idle
            }
            self.session = nil
            self.isoTag = nil
        }
    }

    nonisolated func tagReaderSession(_ session: NFCTagReaderSession,
                                      didInvalidateWithError error: Error) {
        Task { @MainActor in
            self.handleInvalidation(error)
        }
    }

    // MARK: - Connection handling

    private func connect(_ tag: NFCTag) async {
        do {
            try await session?.connect(to: tag)
        } catch {
            status = .error("Couldn't connect: \(error.localizedDescription)")
            return
        }
        guard case .iso7816(let isoTag) = tag else {
            status = .error("Unsupported card type (not ISO 7816).")
            session?.invalidate(errorMessage: "Unsupported card type.")
            return
        }
        self.isoTag = isoTag
        tagIdentifier = Hex.string(isoTag.identifier, grouped: false)
        initialSelectedAID = isoTag.initialSelectedAID
        status = .connected
        appendLog("Connected — ISO 7816 tag, ID \(tagIdentifier ?? "?")")
        session?.alertMessage = "Card connected. You can run commands now."
    }

    // MARK: - APDU exchange

    /// Send a command APDU and await the full response (auto-chains GET RESPONSE
    /// when the card signals SW1=0x61, and retries with the corrected Le on 0x6C).
    @discardableResult
    func send(_ apdu: APDU) async throws -> APDUResponse {
        guard isoTag != nil else { throw BudgieError.unknown }
        status = .sending
        defer {
            if case .sending = status { status = .connected }
        }

        var response = try await exchange(apdu)

        // SW1=0x61 → more data pending: fetch it with GET RESPONSE.
        while let remaining = response.moreDataLength, remaining > 0 {
            response = try await exchange(.getResponse(le: remaining))
        }
        // SW1=0x6C → wrong Le: repeat once with the exact length.
        if let expected = response.wrongLeLength {
            response = try await exchange(apdu.withLe(expected))
        }

        appendLog(response, command: apdu)
        return response
    }

    private func exchange(_ apdu: APDU) async throws -> APDUResponse {
        guard let isoTag else { throw BudgieError.unknown }
        // Raw-bytes APDU init gives full control over the on-wire format.
        guard let apduObject = NFCISO7816APDU(data: apdu.bytes) else {
            throw BudgieError.unknown
        }
        let (data, sw1, sw2) = try await isoTag.sendCommand(apdu: apduObject)
        return APDUResponse(data: data, sw1: sw1, sw2: sw2)
    }

    // MARK: - Logging

    private func appendLog(_ note: String) {
        log.append(ExchangeLog(command: "", response: note, sw: "", status: "", ok: true))
    }

    private func appendLog(_ response: APDUResponse, command: APDU) {
        log.append(ExchangeLog(
            command: command.hex,
            response: Hex.string(response.data),
            sw: response.swHex,
            status: response.statusDescription,
            ok: response.isSuccess
        ))
    }

    // MARK: - Error mapping

    private func handleInvalidation(_ error: Error) {
        session = nil
        isoTag = nil
        let nfcError = error as? NFCReaderError
        let code = nfcError?.code ?? .readerSessionInvalidationErrorFirstNDEFTagRead

        switch code {
        case .readerSessionInvalidationErrorUserCanceled:
            status = .idle
        case .readerSessionInvalidationErrorSessionTimeout:
            status = .error("The scan timed out. Try again.")
        case .readerSessionInvalidationErrorSessionTerminatedUnexpectedly:
            status = .error("The scan ended unexpectedly. Try again.")
        case .readerSessionInvalidationErrorSystemIsBusy:
            status = .error("This iPhone is busy with another card scan. Try again.")
        default:
            // Session invalidated after a successful exchange — keep the log readable.
            if !log.isEmpty {
                status = .connected
            } else {
                status = .error(nfcError?.localizedDescription ?? "The scan failed. Try again.")
            }
        }
    }
}

extension APDU {
    /// Rebuild a copy with a different Le (used for 0x6C retry).
    func withLe(_ newLe: UInt8?) -> APDU {
        APDU(cla: cla, ins: ins, p1: p1, p2: p2, data: data, le: newLe)
    }
}