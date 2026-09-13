//
//  TransactionsView.swift
//  Budgie
//

import SwiftUI

struct TransactionsView: View {
    @State private var vm = TransactionsViewModel()
    @State private var detailTransaction: Transaction?
    @State private var showAddTransaction = false
    @State private var showExport = false

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 0, pinnedViews: [.sectionHeaders]) {
                Text("Transactions")
                    .font(.system(size: 26, weight: .semibold))
                    .tracking(-0.4)
                    .foregroundStyle(Color.budgieTextPrimary)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 8)
                    .padding(.bottom, 14)

                Section {
                    VStack(spacing: 0) {
                        if let errorMessage = vm.errorMessage {
                            ErrorBanner(message: errorMessage)
                                .padding(.bottom, 16)
                        }

                        if vm.isLoading {
                            ProgressView()
                                .padding(.vertical, 80)
                        } else if vm.transactions.isEmpty {
                            emptyState
                        } else if vm.filtered.isEmpty {
                            noResultsState
                        } else {
                            sections
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
                } header: {
                    searchBar
                }
            }
        }
        .background(Color.budgieBackground)
        .fullScreenCover(isPresented: $showAddTransaction) {
            AddTransactionView {
                Task { await vm.load() }
            }
        }
        .sheet(isPresented: $showExport) {
            PDFExportSheet(all: vm.transactions, filtered: vm.filtered)
                .presentationDetents([.medium, .large])
        }
        .scrollDismissesKeyboard(.immediately)
        .refreshable { await vm.load() }
        .task { await vm.load() }
        .onAppear {
            #if DEBUG
            if DebugSeed.flow == "transaction", !showAddTransaction {
                showAddTransaction = true
            }
            #endif
        }
        .onChange(of: vm.transactions) { _, transactions in
            #if DEBUG
            if DebugSeed.opensFirstTransaction, detailTransaction == nil, let first = transactions.first {
                detailTransaction = first
            }
            #endif
        }
        .sheet(item: $detailTransaction) { transaction in
            TransactionDetailSheet(transaction: transaction) {
                Task { await vm.load() }
            }
            .presentationDetents([.medium, .large])
        }
    }

    // MARK: - Search bar (Liquid Glass, pinned while scrolling)

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.budgieTextTertiary)

            TextField("Search transactions", text: $vm.searchText)
                .font(.system(size: 15))
                .foregroundStyle(Color.budgieTextPrimary)
                .tint(.budgieBrand)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .submitLabel(.search)

            if !vm.searchText.isEmpty {
                Button {
                    vm.searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 15))
                        .foregroundStyle(Color.budgieTextTertiary)
                }
                .buttonStyle(.plain)
                .transition(.opacity)
            }

            Button {
                showExport = true
            } label: {
                Image(systemName: "doc.richtext")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(Color.budgieChip))
            }
            .buttonStyle(PressableButtonStyle())
            .disabled(vm.transactions.isEmpty)
            .opacity(vm.transactions.isEmpty ? 0.4 : 1)

            Button {
                showAddTransaction = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(Color.budgieBrand))
            }
            .buttonStyle(PressableButtonStyle())
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .glassEffect()
        .padding(.horizontal, 16)
        .padding(.top, 2)
        .padding(.bottom, 10)
        .animation(.easeOut(duration: 0.15), value: vm.searchText.isEmpty)
    }

    // MARK: - Sections

    private var sections: some View {
        LazyVStack(spacing: 0) {
            ForEach(Array(vm.grouped.enumerated()), id: \.offset) { _, section in
                Text(transactionSectionLabel(section.date))
                    .font(.system(size: 20, weight: .bold))
                    .tracking(-0.3)
                    .foregroundStyle(Color.budgieTextPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 20)
                    .padding(.bottom, 2)

                ForEach(section.items) { transaction in
                    Button {
                        detailTransaction = transaction
                    } label: {
                        TransactionRow(transaction: transaction)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Empty & error

    private var emptyState: some View {
        VStack(spacing: 6) {
            Image(systemName: "arrow.left.arrow.right")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(Color.budgieBrand)
                .padding(.bottom, 4)
            Text("No transactions yet")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)
            Text("Your income, expenses and transfers will show up here.")
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    private var noResultsState: some View {
        VStack(spacing: 6) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(Color.budgieTextTertiary)
                .padding(.bottom, 4)
            Text("No results")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)
            Text("No transactions match \"\(vm.searchQuery)\".")
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}

#Preview {
    TransactionsView()
}
