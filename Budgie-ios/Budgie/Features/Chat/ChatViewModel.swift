//
//  ChatViewModel.swift
//  Budgie
//
//  Chat state machine: UIMessage model, SSE chunk handling, model fallback.
//

import Foundation
import SwiftUI

@MainActor
@Observable
final class ChatViewModel {
    var messages: [UIMessage] = []
    var draft = ""
    var isLoading = false
    var errorMessage: String?
    var model: String
    var downgraded = false

    private var chatId = UUID().uuidString
    private var streamTask: Task<Void, Never>?
    private var pendingUserMessage: UIMessage?
    private var didAutoRetry = false
    private var persistTask: Task<Void, Never>?

    init() {
        model = ChatStore.activeModel()
        if let userId = SessionStore.shared.user?.id {
            messages = ChatStore.loadMessages(for: userId)
            draft = ChatStore.draft(for: userId)
        }
    }

    var activeModelLabel: String { ChatAPI.modelLabel(model) }

    var isStreaming: Bool { isLoading }

    func userFirstName() -> String {
        (SessionStore.shared.user?.name ?? "there")
            .split(separator: " ").first.map(String.init) ?? "there"
    }

    /// Messages may not be loadable at init time (no user yet).
    func refreshFromStorageIfNeeded() {
        guard messages.isEmpty, let userId = SessionStore.shared.user?.id else { return }
        messages = ChatStore.loadMessages(for: userId)
        draft = ChatStore.draft(for: userId)
    }

    // MARK: - Send

    func send(_ textOverride: String? = nil) {
        guard !isLoading else { return }
        let text = (textOverride ?? draft).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        draft = ""

        let userMessage = UIMessage(
            id: UUID().uuidString,
            role: "user",
            parts: [.text(id: nil, text: text, state: "done")]
        )
        messages.append(userMessage)
        pendingUserMessage = userMessage
        persistNow()
        streamUserMessage(userMessage)
    }

    func retry() {
        guard let pending = pendingUserMessage ?? messages.last(where: { $0.role == "user" }) else { return }
        errorMessage = nil
        removeEmptyAssistant()
        streamUserMessage(pending)
    }

    func stop() {
        streamTask?.cancel()
        streamTask = nil
        isLoading = false
        finalizeCurrentAssistant()
        removeEmptyAssistant()
        persistNow()
    }

    func clear() {
        streamTask?.cancel()
        streamTask = nil
        persistTask?.cancel()
        persistTask = nil
        messages = []
        draft = ""
        errorMessage = nil
        downgraded = false
        model = ChatAPI.models[0]
        didAutoRetry = false
        chatId = UUID().uuidString
        if let userId = SessionStore.shared.user?.id {
            ChatStore.clearMessages(for: userId)
            ChatStore.clearDraft(for: userId)
        }
        ChatStore.clearModel()
    }

    func updateDraft(_ value: String) {
        draft = value
        if let userId = SessionStore.shared.user?.id {
            ChatStore.saveDraft(value, for: userId)
        }
    }

    // MARK: - Streaming

    private func streamUserMessage(_ userMessage: UIMessage) {
        errorMessage = nil
        isLoading = true
        let assistant = UIMessage(id: UUID().uuidString, role: "assistant", parts: [])
        messages.append(assistant)

        let apiMessages = preparedMessages()
        let currentModel = model
        let currentChatId = chatId

        streamTask = Task {
            do {
                for try await chunk in ChatAPI.stream(messages: apiMessages, model: currentModel, chatId: currentChatId) {
                    if Task.isCancelled { break }
                    handle(chunk)
                }
                if !Task.isCancelled {
                    isLoading = false
                    finalizeCurrentAssistant()
                    removeEmptyAssistant()
                    persistNow()
                }
            } catch is CancellationError {
                isLoading = false
            } catch {
                if !Task.isCancelled {
                    handleStreamFailure(error)
                }
            }
            streamTask = nil
        }
    }

    /// Send only the last 10 messages; tools only in the last 2, reasoning only in the last 1.
    private func preparedMessages() -> [UIMessage] {
        let recent = Array(messages.suffix(10))
        return recent.enumerated().map { index, message in
            let fromEnd = recent.count - 1 - index
            var parts = message.parts
            if fromEnd > 2 {
                parts = parts.filter { if case .tool = $0 { return false }; return true }
            }
            if fromEnd > 1 {
                parts = parts.filter { if case .reasoning = $0 { return false }; return true }
            }
            return UIMessage(id: message.id, role: message.role, parts: parts)
        }
    }

    private func handle(_ chunk: ChatChunk) {
        switch chunk.type {
        case "start":
            if let messageId = chunk.messageId, !messageId.isEmpty {
                replaceAssistantId(messageId)
            }
        case "text-start":
            appendPart(.text(id: chunk.id, text: "", state: "streaming"))
        case "text-delta":
            appendDelta(to: .text, text: chunk.delta ?? "")
        case "text-end":
            setState(.text, id: chunk.id, state: "done")
        case "reasoning-start":
            appendPart(.reasoning(id: chunk.id, text: "", state: "streaming"))
        case "reasoning-delta":
            appendDelta(to: .reasoning, text: chunk.delta ?? "")
        case "reasoning-end":
            setState(.reasoning, id: chunk.id, state: "done")
        case "tool-input-start":
            appendPart(.tool(name: chunk.toolName ?? "unknown",
                             callId: chunk.toolCallId ?? UUID().uuidString,
                             state: "input-streaming", input: nil, output: nil, errorText: nil))
        case "tool-input-available":
            setToolInput(callId: chunk.toolCallId, input: chunk.input, state: "input-available")
        case "tool-input-error":
            setToolError(callId: chunk.toolCallId, errorText: chunk.errorText ?? "Invalid input")
        case "tool-output-available":
            setToolOutput(callId: chunk.toolCallId, output: chunk.output, state: "output-available")
        case "tool-output-error":
            setToolError(callId: chunk.toolCallId, errorText: chunk.errorText ?? "Tool failed")
        case "finish":
            isLoading = false
            finalizeCurrentAssistant()
            persistDebounced()
        case "error":
            handleErrorChunk(chunk)
        case "abort":
            isLoading = false
            finalizeCurrentAssistant()
            persistDebounced()
        default:
            break
        }
        persistDebounced()
    }

    private func handleErrorChunk(_ chunk: ChatChunk) {
        let text = chunk.errorText ?? "Something went wrong."
        if !didAutoRetry, model == ChatAPI.models[0], ChatAPI.isRateLimitError(text) {
            didAutoRetry = true
            model = ChatAPI.models[1]
            ChatStore.saveModel(model)
            downgraded = true
            errorMessage = nil
            if messages.last?.role == "assistant" {
                messages.removeLast()
            }
            isLoading = false
            if let pending = pendingUserMessage ?? messages.last(where: { $0.role == "user" }) {
                streamUserMessage(pending)
            }
            return
        }
        errorMessage = "Something went wrong"
        isLoading = false
        finalizeCurrentAssistant()
        persistNow()
    }

    private func handleStreamFailure(_ error: Error) {
        isLoading = false
        if let budgie = error as? BudgieError, case .unauthorized = budgie {
            errorMessage = nil
        } else {
            errorMessage = "Something went wrong"
        }
        finalizeCurrentAssistant()
        removeEmptyAssistant()
        persistNow()
    }

    private func removeEmptyAssistant() {
        guard let last = messages.last, last.role == "assistant", last.parts.isEmpty else { return }
        messages.removeLast()
    }

    // MARK: - Part mutations

    private enum PartKind { case text, reasoning }

    private func appendPart(_ part: UIPart) {
        guard let index = messages.indices.last, messages[index].role == "assistant" else { return }
        messages[index].parts.append(part)
    }

    private func appendDelta(to kind: PartKind, text: String) {
        guard let index = messages.indices.last, messages[index].role == "assistant" else { return }
        let parts = messages[index].parts
        guard let partIndex = parts.indices.last else { return }
        switch parts[partIndex] {
        case .text(let id, let existing, let state) where kind == .text:
            messages[index].parts[partIndex] = .text(id: id, text: existing + text, state: state)
        case .reasoning(let id, let existing, let state) where kind == .reasoning:
            messages[index].parts[partIndex] = .reasoning(id: id, text: existing + text, state: state)
        default:
            break
        }
    }

    private func setState(_ kind: PartKind, id: String?, state: String) {
        guard let index = messages.indices.last else { return }
        for (partIndex, part) in messages[index].parts.enumerated() {
            switch (kind, part) {
            case (.text, .text(let partId, let text, _)) where partId == id || id == nil:
                messages[index].parts[partIndex] = .text(id: partId, text: text, state: state)
            case (.reasoning, .reasoning(let partId, let text, _)) where partId == id || id == nil:
                messages[index].parts[partIndex] = .reasoning(id: partId, text: text, state: state)
            default:
                break
            }
        }
    }

    private func setToolInput(callId: String?, input: JSONValue?, state: String) {
        updateTool(callId: callId) { part in
            if case .tool(let name, let id, _, _, let output, let error) = part {
                return .tool(name: name, callId: id, state: state, input: input, output: output, errorText: error)
            }
            return nil
        }
    }

    private func setToolOutput(callId: String?, output: JSONValue?, state: String) {
        updateTool(callId: callId) { part in
            if case .tool(let name, let id, _, let input, _, let error) = part {
                return .tool(name: name, callId: id, state: state, input: input, output: output, errorText: error)
            }
            return nil
        }
    }

    private func setToolError(callId: String?, errorText: String) {
        updateTool(callId: callId) { part in
            if case .tool(let name, let id, _, let input, let output, _) = part {
                return .tool(name: name, callId: id, state: "output-error", input: input, output: output, errorText: errorText)
            }
            return nil
        }
    }

    private func updateTool(callId: String?, transform: (UIPart) -> UIPart?) {
        guard let index = messages.indices.last else { return }
        for (partIndex, part) in messages[index].parts.enumerated() {
            if case .tool(_, let id, _, _, _, _) = part, id == callId || callId == nil {
                if let updated = transform(part) {
                    messages[index].parts[partIndex] = updated
                }
                return
            }
        }
    }

    private func replaceAssistantId(_ newId: String) {
        guard let index = messages.indices.last, messages[index].role == "assistant" else { return }
        messages[index].id = newId
    }

    private func finalizeCurrentAssistant() {
        guard let index = messages.indices.last, messages[index].role == "assistant" else { return }
        messages[index].parts = messages[index].parts.map { part in
            switch part {
            case .text(let id, let text, _):
                return .text(id: id, text: text, state: "done")
            case .reasoning(let id, let text, _):
                return .reasoning(id: id, text: text, state: "done")
            case .tool(let name, let id, let state, let input, let output, let error):
                let finalState = state.hasPrefix("input-") ? "input-available" : state
                return .tool(name: name, callId: id, state: finalState, input: input, output: output, errorText: error)
            }
        }
    }

    // MARK: - Persistence

    private func persistDebounced() {
        persistTask?.cancel()
        persistTask = Task {
            try? await Task.sleep(for: .milliseconds(600))
            guard !Task.isCancelled else { return }
            persistNow()
        }
    }

    private func persistNow() {
        persistTask?.cancel()
        persistTask = nil
        guard let userId = SessionStore.shared.user?.id else { return }
        ChatStore.saveMessages(messages, for: userId)
        ChatStore.saveDraft(draft, for: userId)
    }
}

extension ChatViewModel {
    static let suggestions: [String] = [
        "How much did I spend this month?",
        "What's my net worth?",
        "Show my budgets",
        "Record that I bought coffee"
    ]
}
