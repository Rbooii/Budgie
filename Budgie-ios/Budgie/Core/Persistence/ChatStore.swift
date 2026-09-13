//
//  ChatStore.swift
//  Budgie
//
//  Local chat persistence: messages (file, per user, cap 200), draft, model
//  choice (12h validity).
//

import Foundation

enum ChatStore {
    static let maxMessages = 200
    private static let draftKeyPrefix = "budgie.chat.draft."
    private static let modelKey = "budgie.chat.model"

    // MARK: Messages

    private static func messagesURL(for userId: String) -> URL {
        let directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let folder = directory.appendingPathComponent("BudgieChat", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder.appendingPathComponent("\(userId).json")
    }

    static func loadMessages(for userId: String) -> [UIMessage] {
        let url = messagesURL(for: userId)
        guard let data = try? Data(contentsOf: url),
              let messages = try? JSONCoding.decoder.decode([UIMessage].self, from: data) else {
            return []
        }
        return Array(messages.suffix(maxMessages))
    }

    static func saveMessages(_ messages: [UIMessage], for userId: String) {
        let capped = Array(messages.suffix(maxMessages))
        guard let data = try? JSONCoding.encoder.encode(capped) else { return }
        try? data.write(to: messagesURL(for: userId))
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

    // MARK: Model choice

    private struct ModelChoice: Codable {
        var model: String
        var savedAt: Date
    }

    static func activeModel() -> String {
        guard let data = UserDefaults.standard.data(forKey: modelKey),
              let choice = try? JSONCoding.decoder.decode(ModelChoice.self, from: data) else {
            return ChatAPI.models[0]
        }
        if Date().timeIntervalSince(choice.savedAt) > 12 * 3600 {
            UserDefaults.standard.removeObject(forKey: modelKey)
            return ChatAPI.models[0]
        }
        return choice.model
    }

    static func saveModel(_ model: String) {
        guard let data = try? JSONCoding.encoder.encode(ModelChoice(model: model, savedAt: Date())) else { return }
        UserDefaults.standard.set(data, forKey: modelKey)
    }

    static func clearModel() {
        UserDefaults.standard.removeObject(forKey: modelKey)
    }
}
