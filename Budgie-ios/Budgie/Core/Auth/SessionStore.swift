import Foundation
import SwiftUI

/// Global session state. Owns the Keychain cookie + current user.
@MainActor
@Observable
final class SessionStore {
    static let shared = SessionStore()

    var user: AuthUser?
    var plus: Bool = false
    var isBootstrapping = true

    var isSignedIn: Bool { user != nil }

    private var observers: [NSObjectProtocol] = []

    init() {
        observers.append(NotificationCenter.default.addObserver(
            forName: .budgieCookieUpdated, object: nil, queue: .main) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor in
                self.persistCookie()
            }
        })
        observers.append(NotificationCenter.default.addObserver(
            forName: .budgieSessionExpired, object: nil, queue: .main) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor in
                self.handleSessionExpired()
            }
        })
    }

    // MARK: - Lifecycle

    func bootstrap() async {
        isBootstrapping = true
        defer { isBootstrapping = false }

        if let data = KeychainStore.read(account: KeychainStore.sessionAccount),
           let pair = try? DateFormatters.decoder.decode(CookiePair.self, from: data) {
            SessionCookieBox.shared.pair = pair
        }

        guard SessionCookieBox.shared.pair != nil else { return }

        do {
            if let info = try await AuthAPI.getSession(), let user = info.user {
                self.user = user
                persistCookie()
                loadPlus()
            } else {
                clearLocalSession()
            }
        } catch {
            if case BudgieError.unauthorized = error {
                clearLocalSession()
            }
            // Other failures (offline): keep the cookie, proceed with cached user.
            if let data = UserDefaults.standard.data(forKey: "budgie.cachedUser") {
                self.user = try? DateFormatters.decoder.decode(AuthUser.self, from: data)
            }
        }
    }

    func loadPlus() {
        Task {
            if let status = try? await RESTAPI.userStatus() {
                plus = status.plus
            }
        }
    }

    func refreshUserState() async {
        if let status = try? await RESTAPI.userStatus() {
            plus = status.plus
        }
    }

    // MARK: - Auth actions

    func signIn(email: String, password: String) async throws {
        let user = try await AuthAPI.signIn(email: email, password: password)
        self.user = user
        cacheUser(user)
        loadPlus()
    }

    func signUp(name: String, email: String, password: String) async throws {
        let user = try await AuthAPI.signUp(name: name, email: email, password: password)
        self.user = user
        cacheUser(user)
        loadPlus()
    }

    func signOut() async {
        _ = try? await AuthAPI.signOut()
        clearLocalSession()
    }

    func handleSessionExpired() {
        clearLocalSession()
    }

    // MARK: - Internal

    private func persistCookie() {
        guard let pair = SessionCookieBox.shared.pair else { return }
        if let data = try? DateFormatters.encoder.encode(pair) {
            try? KeychainStore.save(data, account: KeychainStore.sessionAccount)
        }
    }

    private func cacheUser(_ user: AuthUser) {
        if let data = try? DateFormatters.encoder.encode(user) {
            UserDefaults.standard.set(data, forKey: "budgie.cachedUser")
        }
    }

    private func clearLocalSession() {
        SessionCookieBox.shared.pair = nil
        KeychainStore.delete(account: KeychainStore.sessionAccount)
        user = nil
        plus = false
    }
}