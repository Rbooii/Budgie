//
//  TransactionsViewModel.swift
//  Budgie
//

import SwiftUI

@MainActor
@Observable
final class TransactionsViewModel {
    var transactions: [Transaction] = []
    var isLoading = true
    var errorMessage: String?
    var searchText = ""

    init() {
        #if DEBUG
        searchText = DebugSeed.initialSearch ?? ""
        #endif
    }

    var searchQuery: String {
        searchText.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Client-side filter over the transaction name and the category label.
    var filtered: [Transaction] {
        let query = searchQuery.lowercased()
        guard !query.isEmpty else { return transactions }
        return transactions.filter {
            $0.name.lowercased().contains(query)
                || Categories.label($0.category).lowercased().contains(query)
        }
    }

    /// Newest-first sections grouped by calendar day.
    var grouped: [(date: Date, items: [Transaction])] {
        let calendar = Calendar.current
        let sorted = filtered.sorted { $0.date > $1.date }
        var sections: [(Date, [Transaction])] = []
        for transaction in sorted {
            let day = calendar.startOfDay(for: transaction.date)
            if let index = sections.firstIndex(where: { calendar.isDate($0.0, inSameDayAs: day) }) {
                sections[index].1.append(transaction)
            } else {
                sections.append((day, [transaction]))
            }
        }
        return sections
    }

    func load() async {
        errorMessage = nil
        do {
            transactions = try await RESTAPI.transactions()
        } catch let error as BudgieError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Something went wrong."
        }
        isLoading = false
    }
}
