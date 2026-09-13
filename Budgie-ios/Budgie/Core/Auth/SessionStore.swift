//
//  SessionStore.swift
//  Budgie
//
//  Global auth state: owns the Keychain cookie + current user and drives the
//  root signed-in/signed-out switch.
//

import Foundation
import SwiftUI

@MainActor
@Observable
final class SessionStore {
    static let shared = SessionStore()

    private(set) var user: AuthUser?
    private(set) var plus = false
    private(set) var isBootstrapping = true

    var isSignedIn: Bool { user != nil }

    private static let cachedUserKey = "budgie.cachedUser"
    private var observers: [NSObjectProtocol] = []

    private init() {
        observers.append(NotificationCenter.default.addObserver(
            forName: .budgieCookieUpdated, object: nil, queue: .main
        ) { _ in
            Task { @MainActor in SessionStore.shared.persistCookie() }
        })
        observers.append(NotificationCenter.default.addObserver(
            forName: .budgieSessionExpired, object: nil, queue: .main
        ) { _ in
            Task { @MainActor in SessionStore.shared.signOutLocally() }
        })
    }

    // MARK: - Lifecycle

    /// Restores the Keychain cookie, validates it against the server and loads
    /// the cached user when the network is unavailable.
    func bootstrap() async {
        isBootstrapping = true
        defer { isBootstrapping = false }

        if let data = KeychainStore.read(account: KeychainStore.sessionAccount),
           let pair = try? JSONCoding.decoder.decode(CookiePair.self, from: data) {
            SessionCookieBox.shared.pair = pair
        }

        #if DEBUG
        if SessionCookieBox.shared.pair == nil, let pair = DebugSeed.cookie {
            SessionCookieBox.shared.pair = pair
        }
        #endif

        guard SessionCookieBox.shared.pair != nil else { return }

        do {
            if let info = try await AuthAPI.getSession(), let user = info.user {
                self.user = user
                persistCookie()
                cacheUser(user)
                await refreshPlus()
            } else {
                signOutLocally()
            }
        } catch BudgieError.unauthorized {
            signOutLocally()
        } catch {
            // Offline: fall back to the cached user so the app still opens.
            if let data = UserDefaults.standard.data(forKey: Self.cachedUserKey) {
                user = try? JSONCoding.decoder.decode(AuthUser.self, from: data)
            }
        }
    }

    // MARK: - Actions

    func signIn(email: String, password: String) async throws {
        let user = try await AuthAPI.signIn(email: email, password: password)
        self.user = user
        persistCookie()
        cacheUser(user)
        await refreshPlus()
    }

    func signUp(name: String, email: String, password: String) async throws {
        let user = try await AuthAPI.signUp(name: name, email: email, password: password)
        self.user = user
        persistCookie()
        cacheUser(user)
        await refreshPlus()
    }

    func signOut() async {
        _ = try? await AuthAPI.signOut()
        signOutLocally()
    }

    func refreshPlus() async {
        if let status = try? await RESTAPI.userStatus() {
            plus = status.plus
        }
    }

    // MARK: - Internals

    private func persistCookie() {
        guard let pair = SessionCookieBox.shared.pair,
              let data = try? JSONCoding.encoder.encode(pair) else { return }
        try? KeychainStore.save(data, account: KeychainStore.sessionAccount)
    }

    private func cacheUser(_ user: AuthUser) {
        if let data = try? JSONCoding.encoder.encode(user) {
            UserDefaults.standard.set(data, forKey: Self.cachedUserKey)
        }
    }

    private func signOutLocally() {
        SessionCookieBox.shared.pair = nil
        KeychainStore.delete(account: KeychainStore.sessionAccount)
        UserDefaults.standard.removeObject(forKey: Self.cachedUserKey)
        user = nil
        plus = false
    }
}
