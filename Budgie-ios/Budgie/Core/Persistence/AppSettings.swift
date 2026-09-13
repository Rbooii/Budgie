//
//  AppSettings.swift
//  Budgie
//
//  Shared user preferences persisted to UserDefaults. Values are only persisted
//  through the public setters, so debug overrides never leak into storage.
//

import Foundation
import SwiftUI

enum AppearancePreference: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var label: String {
        switch self {
        case .system: return "System"
        case .light: return "Light"
        case .dark: return "Dark"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

@MainActor
@Observable
final class AppSettings {
    static let shared = AppSettings()

    private static let maskedKey = "budgie.masked"
    private static let appearanceKey = "budgie.appearance"

    private var storedMasked: Bool
    private var storedAppearance: AppearancePreference

    /// Whether money amounts are hidden behind "Rp ••••••". Masked by default.
    var masked: Bool {
        get { storedMasked }
        set {
            storedMasked = newValue
            UserDefaults.standard.set(newValue, forKey: Self.maskedKey)
        }
    }

    /// Appearance override. Defaults to following the device theme.
    var appearance: AppearancePreference {
        get { storedAppearance }
        set {
            storedAppearance = newValue
            UserDefaults.standard.set(newValue.rawValue, forKey: Self.appearanceKey)
        }
    }

    private init() {
        var masked = UserDefaults.standard.object(forKey: Self.maskedKey) as? Bool ?? true
        var appearance = UserDefaults.standard.string(forKey: Self.appearanceKey)
            .flatMap(AppearancePreference.init(rawValue:)) ?? .system

        #if DEBUG
        if let raw = ProcessInfo.processInfo.environment["BUDGIE_MASKED"] {
            masked = (raw as NSString).boolValue
        }
        if let raw = ProcessInfo.processInfo.environment["BUDGIE_APPEARANCE"],
           let preference = AppearancePreference(rawValue: raw) {
            appearance = preference
        }
        #endif

        self.storedMasked = masked
        self.storedAppearance = appearance
    }
}
