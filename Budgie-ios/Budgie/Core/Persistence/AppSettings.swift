import Foundation
import SwiftUI

/// Shared, observable app settings (mask + dark mode), persisted to UserDefaults.
@MainActor
@Observable
final class AppSettings {
    static let shared = AppSettings()

    var masked: Bool {
        didSet { UserDefaults.standard.set(masked, forKey: LocalStore.maskKey) }
    }

    var darkMode: Bool {
        didSet { UserDefaults.standard.set(darkMode, forKey: Self.darkModeKey) }
    }

    static let darkModeKey = "budgie.darkMode"

    init() {
        masked = UserDefaults.standard.object(forKey: LocalStore.maskKey) as? Bool ?? true
        darkMode = UserDefaults.standard.bool(forKey: Self.darkModeKey)
    }
}