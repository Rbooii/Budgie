import Foundation

// MARK: - Hex utilities for smart-card work

enum Hex {
    /// "00 A4 04 00 07 D2 76 00 00 85 01 01 00" or "00A40400..." → Data.
    /// Returns nil on odd-length input or invalid characters.
    static func data(from string: String) -> Data? {
        let cleaned = string.filter { !$0.isWhitespace }
        guard !cleaned.isEmpty, cleaned.count.isMultiple(of: 2) else { return nil }
        var bytes: [UInt8] = []
        bytes.reserveCapacity(cleaned.count / 2)
        var index = cleaned.startIndex
        while index < cleaned.endIndex {
            let next = cleaned.index(index, offsetBy: 2)
            guard let byte = UInt8(cleaned[index..<next], radix: 16) else { return nil }
            bytes.append(byte)
            index = next
        }
        return Data(bytes)
    }

    /// Data → "90 00" (spaced) or "9000" (compact).
    static func string(_ data: Data, grouped: Bool = true) -> String {
        let hex = data.map { String(format: "%02X", $0) }
        return grouped ? hex.joined(separator: " ") : hex.joined()
    }
}