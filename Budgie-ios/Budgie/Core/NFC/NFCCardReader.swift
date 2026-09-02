import CoreNFC
import Foundation
import SwiftUI

// MARK: - Parsed NDEF record

struct NFCNDEFRecord: Identifiable {
    let id = UUID()
    let messageIndex: Int
    let recordIndex: Int
    let typeNameFormat: String
    let typeHex: String
    let identifierHex: String
    let payloadHex: String
    let payloadText: String?

    var hexDump: String {
        var lines: [String] = []
        lines.append("Record \(messageIndex + 1).\(recordIndex + 1)")
        lines.append("TNF: \(typeNameFormat)")
        lines.append("Type: \(typeHex)")
        lines.append("ID: \(identifierHex)")
        lines.append("Payload:")
        lines.append(hexLines(payloadHex))
        if let payloadText, !payloadText.isEmpty {
            lines.append("Text: \(payloadText)")
        }
        return lines.joined(separator: "\n")
    }

    private func hexLines(_ hex: String) -> String {
        let chunkSize = 32 // 16 bytes
        return stride(from: 0, to: hex.count, by: chunkSize)
            .map { offset in
                let start = hex.index(hex.startIndex, offsetBy: offset)
                let end = hex.index(start, offsetBy: min(chunkSize, hex.count - offset))
                return String(hex[start..<end])
            }
            .joined(separator: "\n")
    }
}

// MARK: - NFC reader (NDEF-only, works with free team accounts)

@MainActor
@Observable
final class NFCCardReader: NSObject, NFCNDEFReaderSessionDelegate {

    enum Status: Equatable {
        case idle
        case scanning
        case success
        case error(String)
    }

    var status: Status = .idle
    var records: [NFCNDEFRecord] = []
    var detectedCards = 0

    var isReadingAvailable: Bool { NFCNDEFReaderSession.readingAvailable }

    private var session: NFCNDEFReaderSession?

    // MARK: - Scan lifecycle (one session per tap — sessions are single-use)

    func startScan() {
        guard isReadingAvailable else {
            status = .error("This iPhone doesn't support card reading.")
            return
        }
        guard !isScanning else { return }

        records = []
        detectedCards = 0
        status = .scanning

        let newSession = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: true)
        newSession.alertMessage = "Hold your card near the top of your iPhone."
        session = newSession
        newSession.begin()
    }

    func clear() {
        session?.invalidate()
        session = nil
        records = []
        detectedCards = 0
        status = .idle
    }

    private var isScanning: Bool {
        if case .scanning = status { return true }
        return false
    }

    // MARK: - NFCNDEFReaderSessionDelegate

    nonisolated func readerSession(_ session: NFCNDEFReaderSession,
                                   didDetectNDEFs messages: [NFCNDEFMessage]) {
        Task { @MainActor in
            self.handle(messages: messages)
        }
    }

    nonisolated func readerSession(_ session: NFCNDEFReaderSession,
                                   didInvalidateWithError error: Error) {
        Task { @MainActor in
            self.handleInvalidation(error)
        }
    }

    // MARK: - Parsing

    private func handle(messages: [NFCNDEFMessage]) {
        detectedCards += 1
        var parsed: [NFCNDEFRecord] = []

        for (messageIndex, message) in messages.enumerated() {
            for (recordIndex, payload) in message.records.enumerated() {
                parsed.append(parse(payload, messageIndex: messageIndex, recordIndex: recordIndex))
            }
        }

        records = parsed
        if records.isEmpty {
            status = .error("No readable data found on this card. It may use an unsupported chip type.")
        } else {
            status = .success
        }
        session?.alertMessage = "Card detected."
    }

    private func parse(_ payload: NFCNDEFPayload, messageIndex: Int, recordIndex: Int) -> NFCNDEFRecord {
        let typeData = payload.type
        let identifierData = payload.identifier
        let payloadData = payload.payload

        return NFCNDEFRecord(
            messageIndex: messageIndex,
            recordIndex: recordIndex,
            typeNameFormat: tnfName(payload.typeNameFormat),
            typeHex: typeData.hexString,
            identifierHex: identifierData.hexString,
            payloadHex: payloadData.hexString,
            payloadText: readableText(from: payloadData)
        )
    }

    private func tnfName(_ tnf: NFCTypeNameFormat) -> String {
        switch tnf.rawValue {
        case 0x00: return "Empty"
        case 0x01: return "Well-known"
        case 0x02: return "MIME media"
        case 0x03: return "Absolute URI"
        case 0x04: return "External"
        case 0x05: return "Unknown"
        case 0x06: return "Unchanged"
        default: return "Other"
        }
    }

    /// Best-effort text decode: UTF-8 first, then ASCII if it's printable.
    private func readableText(from data: Data) -> String? {
        if let text = String(data: data, encoding: .utf8), !text.isEmpty, isPrintable(text) {
            return text
        }
        let ascii = data.map { Character(UnicodeScalar($0)) }
        let text = String(ascii)
        if !text.isEmpty, text.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber || $0.isWhitespace || $0.isPunctuation) }) {
            return text
        }
        return nil
    }

    private func isPrintable(_ text: String) -> Bool {
        text.allSatisfy { $0.isASCII && ($0.isLetter || $0.isNumber || $0.isWhitespace || $0.isPunctuation) }
    }

    // MARK: - Error handling

    private func handleInvalidation(_ error: Error) {
        session = nil
        let nfcError = error as? NFCReaderError
        let code = nfcError?.code ?? .readerSessionInvalidationErrorFirstNDEFTagRead

        // Automatic invalidate after a successful read — not an error.
        if code == .readerSessionInvalidationErrorFirstNDEFTagRead {
            if records.isEmpty {
                status = .idle
            }
            return
        }

        guard !isScanning else { return }

        switch code {
        case .readerSessionInvalidationErrorUserCanceled:
            status = records.isEmpty ? .idle : .success
        case .readerSessionInvalidationErrorSessionTimeout:
            status = .error("The scan timed out. Try again.")
        case .readerSessionInvalidationErrorSessionTerminatedUnexpectedly:
            status = .error("The scan ended unexpectedly. Try again.")
        case .readerSessionInvalidationErrorSystemIsBusy:
            status = .error("This iPhone is busy with another card scan. Try again.")
        default:
            status = .error(nfcError?.localizedDescription ?? "The scan failed. Try again.")
        }
    }
}

// MARK: - Helpers

extension Data {
    var hexString: String {
        map { String(format: "%02X", $0) }
            .joined(separator: " ")
    }
}