import Foundation

/// Local persistence per §12: chat messages (file, per-user, cap 200), draft,
/// model choice (12h validity), mask toggle.
enum LocalStore {
    static let messagesKeyPrefix = "budgie.chat.messages."
    static let draftKeyPrefix = "budgie.chat.draft."
    static let modelKey = "budgie.chat.model"
    static let maskKey = "budgie.balanceMasked"

    static let maxMessages = 200

    // MARK: Messages

    static func messagesURL(for userId: String) -> URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let folder = dir.appendingPathComponent("BudgieChat", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder.appendingPathComponent("\(userId).json")
    }

    static func loadMessages(for userId: String) -> [UIMessage] {
        let url = messagesURL(for: userId)
        guard let data = try? Data(contentsOf: url) else { return [] }
        let messages = try? DateFormatters.decoder.decode([UIMessage].self, from: data)
        return Array((messages ?? []).suffix(maxMessages))
    }

    static func saveMessages(_ messages: [UIMessage], for userId: String) {
        let url = messagesURL(for: userId)
        let capped = Array(messages.suffix(maxMessages))
        if let data = try? DateFormatters.encoder.encode(capped) {
            try? data.write(to: url)
        }
    }

    static func clearMessages(for userId: String) {
        try? FileManager.default.removeItem(at: messagesURL(for: userId))
    }

    // MARK: Draft

    static func draft(for userId: String) -> String {
        UserDefaults.standard.string(forKey: draftKeyPrefix + userId) ?? ""
    }

    static func saveDraft(_ draft: String, for userId: String) {
        UserDefaults.standard.set(draft, forKey: draftKeyPrefix + userId)
    }

    static func clearDraft(for userId: String) {
        UserDefaults.standard.removeObject(forKey: draftKeyPrefix + userId)
    }

    // MARK: Model choice (12h validity)

    struct ModelChoice: Codable {
        var model: String
        var savedAt: Date
    }

    static func activeModel() -> String {
        guard let data = UserDefaults.standard.data(forKey: modelKey),
              let choice = try? DateFormatters.decoder.decode(ModelChoice.self, from: data) else {
            return ChatAPI.models[0]
        }
        if Date().timeIntervalSince(choice.savedAt) > 12 * 3600 {
            UserDefaults.standard.removeObject(forKey: modelKey)
            return ChatAPI.models[0]
        }
        return choice.model
    }

    static func saveModel(_ model: String) {
        let choice = ModelChoice(model: model, savedAt: Date())
        if let data = try? DateFormatters.encoder.encode(choice) {
            UserDefaults.standard.set(data, forKey: modelKey)
        }
    }

    static func clearModel() {
        UserDefaults.standard.removeObject(forKey: modelKey)
    }

    // MARK: Account order (drag & drop reorder — client-side preference)

    static func accountOrderKey(for userId: String) -> String {
        "budgie.accountOrder.\(userId)"
    }

    static func accountOrder(for userId: String) -> [String] {
        UserDefaults.standard.stringArray(forKey: accountOrderKey(for: userId)) ?? []
    }

    static func saveAccountOrder(_ order: [String], for userId: String) {
        UserDefaults.standard.set(order, forKey: accountOrderKey(for: userId))
    }
}