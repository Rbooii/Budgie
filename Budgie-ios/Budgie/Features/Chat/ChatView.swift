import SwiftUI
import Combine

struct ChatView: View {
    @State private var vm = ChatViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                slimTopBar
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 16) {
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
                        .padding(.horizontal, 20)
                        .padding(.vertical, 16)
                        .frame(maxWidth: 768)
                        .frame(maxWidth: .infinity)
                        .animation(.easeOut(duration: 0.25), value: vm.messages.count)
                    }
                    .scrollDismissesKeyboard(.interactively)
                    .onAppear {
                        proxy.scrollTo("bottom", anchor: .bottom)
                    }
                    .onChange(of: vm.messages.count) { _, _ in
                        scrollToBottom(proxy)
                    }
                    .onReceive(Timer.publish(every: 0.4, on: .main, in: .common).autoconnect()) { _ in
                        if vm.isLoading { scrollToBottom(proxy) }
                    }
                }

                if let errorMessage = vm.errorMessage {
                    errorSurface(errorMessage)
                        .padding(.horizontal, 20)
                        .padding(.bottom, 8)
                }

                composer
            }
            .background(Color(.systemBackground))
            .navigationTitle("Budgie AI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 6) {
                        Image(systemName: SFIcons.sparkles)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(Color.budgieBrand)
                        Text("Budgie AI")
                            .font(.system(size: 17, weight: .semibold))
                    }
                }
            }
            .task { vm.refreshFromStorageIfNeeded() }
        }
    }

    // MARK: Slim top bar (downgrade notice · clear chat)

    private var slimTopBar: some View {
        HStack {
            if vm.downgraded {
                HStack(spacing: 5) {
                    Image(systemName: "info.circle")
                        .font(.system(size: 11))
                    Text("Switched to a lighter model to stay within free limits.")
                        .font(.system(size: 11))
                }
                .foregroundStyle(Color.budgieTextSecondary)
                .lineLimit(1)
            }
            Spacer()
            if !vm.messages.isEmpty {
                Button {
                    vm.clear()
                } label: {
                    Image(systemName: SFIcons.trash)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.budgieTextSecondary)
                        .frame(width: 30, height: 30)
                        .background(Circle().fill(Color.budgieSurfaceGray))
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 4)
    }

    // MARK: Empty state

    private var emptyState: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle().fill(Color.budgieIncomePastel.opacity(0.4))
                Image(systemName: SFIcons.sparkles)
                    .font(.system(size: 26))
                    .foregroundStyle(Color.budgieBrand)
            }
            .frame(width: 64, height: 64)
            .padding(.top, 56)

            Text("Hi \(vm.userFirstName()), ask me anything about your money")
                .font(.system(size: 20, weight: .semibold))
                .tracking(-0.3)
                .foregroundStyle(Color.budgieTextPrimary)
                .multilineTextAlignment(.center)

            RowContainer {
                ForEach(Array(ChatViewModel.suggestions.enumerated()), id: \.offset) { index, suggestion in
                    if index > 0 { RowDivider() }
                    Button {
                        vm.send(suggestion)
                    } label: {
                        HStack {
                            Text(suggestion)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(Color.budgieTextPrimary)
                            Spacer(minLength: 0)
                        }
                        .padding(.vertical, 11)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(.horizontal, 8)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: Message rows

    @ViewBuilder
    private func messageRow(_ message: UIMessage) -> some View {
        if message.role == "user" {
            HStack {
                Spacer()
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
                    TypingDots()
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .transition(.opacity.combined(with: .move(edge: .bottom)))
        }
    }

    // MARK: Error surface

    private func errorSurface(_ message: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 13, weight: .semibold))
            Text(message)
                .font(.system(size: 13, weight: .medium))
                .fixedSize(horizontal: false, vertical: true)
            Spacer()
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
            .buttonStyle(PlainButtonStyle())
        }
        .foregroundStyle(Color.budgieExpense)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.budgieExpensePastel.opacity(0.45))
        .clipShape(.rect(cornerRadius: 20))
    }

    // MARK: Composer (compact)

    private var composer: some View {
        VStack(spacing: 5) {
            HStack(alignment: .bottom, spacing: 8) {
                VStack(alignment: .leading, spacing: 6) {
                    Menu {
                        ForEach(ChatAPI.models, id: \.self) { m in
                            Button {
                                vm.model = m
                                LocalStore.saveModel(m)
                                vm.downgraded = false
                            } label: {
                                if m == vm.model {
                                    Label(ChatAPI.modelLabel(m), systemImage: "checkmark")
                                } else {
                                    Text(ChatAPI.modelLabel(m))
                                }
                            }
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: SFIcons.sparkles)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(Color.budgieBrand)
                            Text(vm.activeModelLabel)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(Color.budgieTextSecondary)
                                .lineLimit(1)
                            Image(systemName: "chevron.up.chevron.down")
                                .font(.system(size: 8))
                                .foregroundStyle(Color.budgieTextFaint)
                        }
                        .padding(.horizontal, 9)
                        .padding(.vertical, 5)
                        .background(Capsule().fill(Color.budgieSurfaceGray))
                    }

                    TextField("Ask about your money…", text: Binding(
                            get: { vm.draft },
                            set: { vm.updateDraft($0) }
                        ), axis: .vertical)
                        .font(.system(size: 15))
                        .lineLimit(1...4)
                        .onSubmit {
                            vm.send()
                        }
                }

                Button {
                    if vm.isStreaming {
                        vm.stop()
                    } else {
                        vm.send()
                    }
                } label: {
                    ZStack {
                        Circle()
                            .glassEffect(
                                .regular.tint(vm.isStreaming ? Color(hex: 0x171717) : Color.budgieBrand),
                                in: .circle
                            )
                        if vm.isStreaming {
                            Image(systemName: "stop.fill")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.white)
                        } else {
                            Image(systemName: "arrow.up")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(.white)
                        }
                    }
                    .frame(width: 34, height: 34)
                }
                .buttonStyle(PlainButtonStyle())
                .disabled(!vm.isStreaming && vm.draft.trimmingCharacters(in: .whitespaces).isEmpty)
                .opacity((!vm.isStreaming && vm.draft.isEmpty) ? 0.45 : 1)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)
            .clipShape(.rect(cornerRadius: 22))
            .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color.budgieHairline, lineWidth: 1))
            .shadow(color: .black.opacity(0.06), radius: 12, y: 4)

            Text("Budgie can make mistakes. Double-check the important numbers.")
                .font(.system(size: 11))
                .foregroundStyle(Color.budgieTextFaint)
        }
        .padding(.horizontal, 14)
        .padding(.top, 6)
        .padding(.bottom, 6)
        .frame(maxWidth: 768)
    }

    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        withAnimation(.easeOut(duration: 0.2)) {
            proxy.scrollTo("bottom", anchor: .bottom)
        }
    }
}