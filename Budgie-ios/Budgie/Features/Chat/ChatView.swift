//
//  ChatView.swift
//  Budgie
//
//  Minimal Claude-style chat on a warm canvas.
//

import SwiftUI
import Combine

struct ChatView: View {
    @State private var vm = ChatViewModel()

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 14) {
                        if vm.messages.isEmpty {
                            emptyState
                        } else {
                            ForEach(vm.messages) { message in
                                messageRow(message)
                                    .id(message.id)
                            }
                        }
                        Color.clear
                            .frame(height: 1)
                            .id("bottom")
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .animation(.easeOut(duration: 0.25), value: vm.messages.count)
                }
                .scrollDismissesKeyboard(.interactively)
                .onAppear { proxy.scrollTo("bottom", anchor: .bottom) }
                .onChange(of: vm.messages.count) { _, _ in scrollToBottom(proxy) }
                .onReceive(Timer.publish(every: 0.4, on: .main, in: .common).autoconnect()) { _ in
                    if vm.isLoading { scrollToBottom(proxy) }
                }
            }

            if let errorMessage = vm.errorMessage {
                errorSurface(errorMessage)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
            }

            composer
        }
        .background(Color.budgieChatBackground)
        .task { vm.refreshFromStorageIfNeeded() }
        .onAppear {
            #if DEBUG
            if let prompt = DebugSeed.chatPrompt, vm.messages.isEmpty {
                vm.send(prompt)
            }
            #endif
        }
    }

    // MARK: - Header

    private var header: some View {
        ZStack {
            modelMenu

            HStack {
                circleButton(icon: "square.and.pencil") {
                    withAnimation(.easeOut(duration: 0.2)) { vm.clear() }
                }

                Spacer()

                if !vm.messages.isEmpty {
                    circleButton(icon: "trash") {
                        withAnimation(.easeOut(duration: 0.2)) { vm.clear() }
                    }
                    .transition(.opacity)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 6)
        .padding(.bottom, 10)
    }

    private func circleButton(icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color.budgieInk)
                .frame(width: 40, height: 40)
                .background(Circle().fill(Color.budgieCard))
                .shadow(color: .black.opacity(0.06), radius: 8, y: 2)
        }
        .buttonStyle(PressableButtonStyle())
    }

    private var modelMenu: some View {
        Menu {
            ForEach(ChatAPI.models, id: \.self) { candidate in
                Button {
                    vm.model = candidate
                    vm.downgraded = false
                    ChatStore.saveModel(candidate)
                } label: {
                    if candidate == vm.model {
                        Label(ChatAPI.modelLabel(candidate), systemImage: "checkmark")
                    } else {
                        Text(ChatAPI.modelLabel(candidate))
                    }
                }
            }
        } label: {
            HStack(spacing: 4) {
                Text(vm.activeModelLabel)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.budgieInk)
                Image(systemName: "chevron.down")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Color.budgieInk.opacity(0.7))
            }
        }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 28) {
            Spacer(minLength: 60)

            Text("How can I help you \(timeOfDayPhrase)?")
                .font(.system(size: 34, weight: .regular, design: .serif))
                .multilineTextAlignment(.center)
                .foregroundStyle(Color.budgieTextPrimary)
                .padding(.horizontal, 20)

            VStack(spacing: 10) {
                ForEach(ChatViewModel.suggestions.prefix(3), id: \.self) { suggestion in
                    Button {
                        vm.send(suggestion)
                    } label: {
                        Text(suggestion)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Color.budgieTextSecondary)
                            .padding(.horizontal, 18)
                            .frame(height: 40)
                            .background(Capsule().fill(Color.budgieCard))
                            .overlay(Capsule().stroke(Color.budgieHairline, lineWidth: 1))
                    }
                    .buttonStyle(PressableButtonStyle())
                }
            }

            Spacer(minLength: 60)
        }
        .frame(maxWidth: .infinity)
    }

    private var timeOfDayPhrase: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "this morning"
        case 12..<17: return "this afternoon"
        case 17..<22: return "this evening"
        default: return "this late night"
        }
    }

    // MARK: - Messages

    @ViewBuilder
    private func messageRow(_ message: UIMessage) -> some View {
        if message.role == "user" {
            HStack {
                Spacer(minLength: 44)
                ChatUserBubble(text: message.textContent)
            }
            .transition(.opacity.combined(with: .move(edge: .bottom)))
        } else {
            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array(message.parts.enumerated()), id: \.offset) { _, part in
                    switch part {
                    case .text(_, let text, _) where !text.isEmpty:
                        ChatAssistantText(text: text)
                    case .reasoning:
                        ChatThinkingBlock(part: part)
                    case .tool:
                        ChatToolCard(part: part)
                    default:
                        EmptyView()
                    }
                }
                if vm.isLoading, message.parts.isEmpty {
                    ChatTypingBubble()
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .transition(.opacity.combined(with: .move(edge: .bottom)))
        }
    }

    // MARK: - Error

    private func errorSurface(_ message: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 13, weight: .semibold))
            Text(message)
                .font(.system(size: 13, weight: .medium))
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 8)
            Button {
                vm.retry()
            } label: {
                Text("Retry")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.budgieExpense)
                    .padding(.horizontal, 14)
                    .frame(height: 32)
                    .background(Capsule().stroke(Color.budgieExpense.opacity(0.5), lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
        .foregroundStyle(Color.budgieExpense)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.budgieExpense.opacity(0.1), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    // MARK: - Composer

    private var draftBinding: Binding<String> {
        Binding(get: { vm.draft }, set: { vm.updateDraft($0) })
    }

    private var canSend: Bool {
        vm.isStreaming || !vm.draft.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private var composer: some View {
        VStack(spacing: 8) {
            if vm.downgraded {
                HStack(spacing: 5) {
                    Image(systemName: "info.circle")
                        .font(.system(size: 11))
                    Text("Switched to a lighter model to stay within free limits.")
                        .font(.system(size: 11))
                        .lineLimit(1)
                    Spacer()
                }
                .foregroundStyle(Color.budgieTextSecondary)
            }

            VStack(spacing: 6) {
                TextField("Message Budgie…", text: draftBinding, axis: .vertical)
                    .font(.system(size: 16))
                    .foregroundStyle(Color.budgieTextPrimary)
                    .tint(.budgieBrand)
                    .lineLimit(1...5)
                    .padding(.horizontal, 18)
                    .padding(.top, 14)

                HStack {
                    Spacer()
                    sendButton
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 12)
            }
            .background(Color.budgieCard, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 16, y: 6)
        }
        .padding(.horizontal, 16)
        .padding(.top, 6)
        .padding(.bottom, 8)
    }

    private var sendButton: some View {
        Button {
            if vm.isStreaming {
                vm.stop()
            } else {
                vm.send()
            }
        } label: {
            ZStack {
                Circle().fill(canSend ? Color.budgieInk : Color.budgieInk.opacity(0.2))
                Image(systemName: vm.isStreaming ? "stop.fill" : "arrow.up")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Color.budgieInkContrast)
            }
            .frame(width: 38, height: 38)
        }
        .buttonStyle(PressableButtonStyle())
        .disabled(!canSend)
    }

    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        withAnimation(.easeOut(duration: 0.2)) {
            proxy.scrollTo("bottom", anchor: .bottom)
        }
    }
}

#Preview {
    ChatView()
        .environment(SessionStore.shared)
}
