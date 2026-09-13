//
//  AuthAPI.swift
//  Budgie
//
//  better-auth endpoints. Initial sign-in/sign-up send NO Cookie and NO Origin
//  (satisfies the CSRF origin check); cookie-bearing auth POSTs add Origin.
//

import Foundation

enum AuthAPI {
    static func signIn(email: String, password: String) async throws -> AuthUser {
        struct Body: Encodable { let email: String; let password: String }
        let request = APIRequest(
            method: "POST",
            path: "/api/auth/sign-in/email",
            body: Body(email: email, password: password),
            includeCookie: false,
            includeOrigin: false
        )
        let response: SignInResponse = try await APIClient.send(request, as: SignInResponse.self)
        guard let user = response.user else {
            throw BudgieError.unauthorized("Invalid email or password.")
        }
        return user
    }

    static func signUp(name: String, email: String, password: String) async throws -> AuthUser {
        struct Body: Encodable { let name: String; let email: String; let password: String }
        let request = APIRequest(
            method: "POST",
            path: "/api/auth/sign-up/email",
            body: Body(name: name, email: email, password: password),
            includeCookie: false,
            includeOrigin: false
        )
        let response: SignUpResponse = try await APIClient.send(request, as: SignUpResponse.self)
        guard let user = response.user else {
            throw BudgieError.unknown
        }
        return user
    }

    static func getSession() async throws -> SessionInfo? {
        try await APIClient.sendOptional(
            APIRequest(path: "/api/auth/get-session"),
            as: SessionInfo.self
        )
    }

    static func signOut() async throws {
        let _: SignOutResponse = try await APIClient.send(
            APIRequest(method: "POST", path: "/api/auth/sign-out", includeOrigin: true),
            as: SignOutResponse.self
        )
    }
}
