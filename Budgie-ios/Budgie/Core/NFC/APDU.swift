import Foundation

// MARK: - APDU (Application Protocol Data Unit) — ISO 7816-4

/// A command APDU:
///   CLA INS P1 P2 [Lc Data] [Le]
/// - CLA  : instruction class (0x00 = ISO 7816-4 interindustry)
/// - INS  : instruction code (0xA4 SELECT, 0xB2 READ RECORD, 0xCA GET DATA,
///          0xC0 GET RESPONSE, 0x84 GET CHALLENGE, 0x88 INTERNAL AUTH, 0x82 EXTERNAL AUTH)
/// - P1/P2: instruction parameters (e.g. SELECT: P1=0x04 select-by-DF-name,
///          P2=0x00 first-or-only occurrence)
/// - Lc   : length of the command Data field (present when Data is non-empty)
/// - Data : command body (e.g. the AID being selected)
/// - Le   : maximum expected response length (0x00 = max available)
struct APDU {
    let cla: UInt8
    let ins: UInt8
    let p1: UInt8
    let p2: UInt8
    let data: Data
    let le: UInt8?

    var bytes: Data {
        var result = Data([cla, ins, p1, p2])
        if !data.isEmpty {
            result.append(UInt8(data.count)) // Lc
            result.append(data)
        }
        if let le {
            result.append(le)
        }
        return result
    }

    var hex: String { Hex.string(bytes) }

    // MARK: Builders (public ISO 7816-4 command templates)

    /// SELECT a file by its DF Name (AID). P1=0x04 means "select by DF name".
    static func select(byDFName aid: Data) -> APDU {
        APDU(cla: 0x00, ins: 0xA4, p1: 0x04, p2: 0x00, data: aid, le: 0x00)
    }

    /// SELECT the Master File / by file identifier. P1=0x00 "select by file ID",
    /// P2=0x00 first occurrence. FID is 2 bytes: MF=0x3F00.
    static func select(byFileId fid: UInt16) -> APDU {
        APDU(cla: 0x00, ins: 0xA4, p1: 0x00, p2: 0x00,
             data: Data([UInt8(fid >> 8), UInt8(fid & 0xFF)]), le: 0x00)
    }

    /// READ RECORD — read record `record` (1-based, 0x00 = current) of file `file`
    /// (P2 high nibble: 0x04 = "record of P1", low nibble: file number).
    static func readRecord(_ record: UInt8, file: UInt8 = 0x04) -> APDU {
        APDU(cla: 0x00, ins: 0xB2, p1: record, p2: file, data: Data(), le: 0x00)
    }

    /// GET DATA — fetch data object identified by a 2-byte tag.
    static func getData(tag: UInt16) -> APDU {
        APDU(cla: 0x00, ins: 0xCA, p1: UInt8(tag >> 8), p2: UInt8(tag & 0xFF),
             data: Data(), le: 0x00)
    }

    /// GET RESPONSE — retrieve the remainder of a previous response
    /// (needed when the card answers SW1=0x61 with a longer payload).
    static func getResponse(le: UInt8 = 0x00) -> APDU {
        APDU(cla: 0x00, ins: 0xC0, p1: 0x00, p2: 0x00, data: Data(), le: le)
    }

    /// GET CHALLENGE — card returns a random challenge (start of a
    /// mutual-authentication loop). Le = expected challenge length.
    static func getChallenge(le: UInt8 = 0x08) -> APDU {
        APDU(cla: 0x00, ins: 0x84, p1: 0x00, p2: 0x00, data: Data(), le: le)
    }
}

// MARK: - Response status words

struct APDUResponse {
    let data: Data
    let sw1: UInt8
    let sw2: UInt8

    /// 0x90 0x00 = success.
    var isSuccess: Bool { sw1 == 0x90 && sw2 == 0x00 }

    /// SW1=0x61 → more data available; SW2 holds the number of bytes to GET RESPONSE.
    var moreDataLength: UInt8? { sw1 == 0x61 ? sw2 : nil }

    /// SW1=0x6C → wrong Le; SW2 holds the exact length to request next time.
    var wrongLeLength: UInt8? { sw1 == 0x6C ? sw2 : nil }

    var swHex: String { String(format: "%02X %02X", sw1, sw2) }

    /// Human-readable status description for logs/UI.
    var statusDescription: String {
        if isSuccess { return "Success" }
        if let n = moreDataLength { return "More data (\(n) bytes — GET RESPONSE)" }
        if let n = wrongLeLength { return "Wrong Le — use \(n)" }
        switch (sw1, sw2) {
        case (0x6A, 0x82): return "File not found"
        case (0x6A, 0x86): return "Incorrect P1/P2"
        case (0x6A, 0x88): return "Referenced data not found"
        case (0x69, 0x82): return "Security status not satisfied"
        case (0x69, 0x84): return "Referenced data invalidated"
        case (0x69, 0x85): return "Conditions of use not satisfied"
        case (0x69, 0x86): return "Command not allowed"
        case (0x6B, 0x00): return "Wrong parameters P1/P2"
        case (0x6D, 0x00): return "Instruction not supported"
        case (0x6E, 0x00): return "Class not supported"
        case (0x67, 0x00): return "Wrong length (Lc/Le)"
        case (0x63, 0x00): return "Authentication failed"
        case (0x63, 0xC0..<0xD0): return "PIN verification failed, retries left: \(sw2 - 0xC0)"
        case (0x98, _): return "Security status not satisfied (proprietary)"
        default: return "SW \(swHex)"
        }
    }
}

// MARK: - Public standard identifiers (EMV / ISO 7816)

enum SmartCardConstants {
    /// Payment System Environment — public EMV discovery AID.
    static let ppseAID = "2PAY.SYS.DDF01"
    /// Payment System Environment (legacy) — public EMV discovery AID.
    static let pseAID = "1PAY.SYS.DDF01"
    /// Master File file identifier.
    static let masterFileFID: UInt16 = 0x3F00
}