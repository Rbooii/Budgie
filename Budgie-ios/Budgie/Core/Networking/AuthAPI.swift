import Foundation

/// better-auth endpoints. Initial sign-in/sign-up send NO cookie and NO Origin
/// (satisfies the CSRF origin check). Cookie-bearing auth POSTs add the Origin header.
enum AuthAPI {
    static func signIn(email: String, password: String) async throws -> AuthUser {
        struct Body: Encodable { let email: String; let password: String }
        let req = APIRequest(method: "POST", path: "/api/auth/sign-in/email",
                             body: Body(email: email, password: password),
                             includeCookie: false, includeOrigin: false)
        let response: SignInResponse = try await APIClient.send(req, as: SignInResponse.self)
        guard let user = response.user else {
            throw BudgieError.unauthorized("Invalid email or password.")
        }
        return user
    }

    static func signUp(name: String, email: String, password: String) async throws -> AuthUser {
        struct Body: Encodable { let name: String; let email: String; let password: String }
        let req = APIRequest(method: "POST", path: "/api/auth/sign-up/email",
                             body: Body(name: name, email: email, password: password),
                             includeCookie: false, includeOrigin: false)
        let response: SignUpResponse = try await APIClient.send(req, as: SignUpResponse.self)
        guard let user = response.user else {
            throw BudgieError.unknown
        }
        return user
    }

    static func getSession() async throws -> SessionInfo? {
        let req = APIRequest(path: "/api/auth/get-session")
        return try await APIClient.sendOptional(req, as: SessionInfo.self)
    }

    static func signOut() async throws {
        let req = APIRequest(method: "POST", path: "/api/auth/sign-out", includeOrigin: true)
        let _: SignOutResponse = try await APIClient.send(req, as: SignOutResponse.self)
    }
}