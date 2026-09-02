import Foundation

/// NFC card reading requires Apple's paid Developer Program membership:
/// the `com.apple.developer.nfc.readersession.formats` entitlement (TAG/NDEF)
/// is never provisioned for free/personal teams — calling into the NFC daemon
/// without it fails (XPC invalidation).
///
/// To enable card reading:
/// 1. Upgrade to a paid Apple Developer account.
/// 2. Add the "Near Field Communication Tag Reading" capability in
///    Signing & Capabilities (generates the formats entitlement).
/// 3. Set `cardReaderEnabled` to `true` below.
enum NFCFeatureGate {
    static let cardReaderEnabled = false
}