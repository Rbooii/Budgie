//
//  DebugSeed.swift
//  Budgie
//
//  DEBUG-only launch hooks used for local simulator runs:
//    BUDGIE_COOKIE="<name>=<value>"   pre-seed the session cookie
//    BUDGIE_TAB="home|transactions"   select the initial tab
//    BUDGIE_SEARCH="netflix"          pre-fill the transaction search
//    BUDGIE_MASKED="true|false"       force the balance mask state
//    BUDGIE_TXN="first"               auto-open the newest transaction drawer
//    BUDGIE_FLOW="account|transaction|budget|profile|plus"    auto-open a flow
//    BUDGIE_FLOW_STEP="1|2|3"             jump to a flow step (debug preview)
//

#if DEBUG
import Foundation

enum DebugSeed {
    static var cookie: CookiePair? {
        guard let raw = ProcessInfo.processInfo.environment["BUDGIE_COOKIE"],
              let separator = raw.firstIndex(of: "=") else { return nil }
        let name = String(raw[..<separator])
        let value = String(raw[raw.index(after: separator)...])
        guard !name.isEmpty, !value.isEmpty else { return nil }
        return CookiePair(name: name, value: value)
    }

    static var initialTab: AppTab? {
        guard let raw = ProcessInfo.processInfo.environment["BUDGIE_TAB"] else { return nil }
        return AppTab(rawValue: raw)
    }

    static var initialSearch: String? {
        ProcessInfo.processInfo.environment["BUDGIE_SEARCH"]
    }

    static var opensFirstTransaction: Bool {
        ProcessInfo.processInfo.environment["BUDGIE_TXN"] == "first"
    }

    static var flow: String? {
        ProcessInfo.processInfo.environment["BUDGIE_FLOW"]
    }

    static var flowStep: Int? {
        ProcessInfo.processInfo.environment["BUDGIE_FLOW_STEP"].flatMap(Int.init)
    }

    static var chatPrompt: String? {
        ProcessInfo.processInfo.environment["BUDGIE_CHAT"]
    }
}
#endif
