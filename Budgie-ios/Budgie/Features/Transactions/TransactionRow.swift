//
//  TransactionRow.swift
//  Budgie
//

import SwiftUI

struct TransactionRow: View {
    let transaction: Transaction

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: transaction.type.iconName)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(transaction.type.strongColor)
                .frame(width: 22)

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                    .lineLimit(1)
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.budgieTextSecondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 8)

            Text(formatRupiah(transaction.amount))
                .font(.system(size: 17, weight: .semibold))
                .monospacedDigit()
                .tracking(-0.3)
                .foregroundStyle(transaction.type.strongColor)
                .lineLimit(1)
        }
        .padding(.vertical, 14)
    }

    private var subtitle: String {
        switch transaction.type {
        case .transfer:
            let from = transaction.balanceAccount?.name ?? "Deleted account"
            let to = transaction.toBalanceAccount?.name ?? "Deleted account"
            var text = "\(from) to \(to)"
            if transaction.adminFee > 0 {
                text += " Fee : \(formatNumber(transaction.adminFee))"
            }
            return text
        default:
            let account = transaction.balanceAccount?.name ?? "Deleted account"
            return "\(account) - \(Categories.label(transaction.category))"
        }
    }
}

#Preview {
    VStack {
        TransactionRow(transaction: Transaction(
            id: "1", name: "Bought a kebab", amount: 120_000, type: .expense,
            category: "FoodAndDrink", date: Date(), adminFee: 0,
            balanceAccountId: "a", toBalanceAccountId: nil, userId: "u",
            createdAt: "", updatedAt: "",
            balanceAccount: AccountRef(id: "a", name: "BCA", currency: "IDR"),
            toBalanceAccount: nil
        ))
        TransactionRow(transaction: Transaction(
            id: "2", name: "Gajian", amount: 1_200_000, type: .income,
            category: "Salary", date: Date(), adminFee: 0,
            balanceAccountId: "a", toBalanceAccountId: nil, userId: "u",
            createdAt: "", updatedAt: "",
            balanceAccount: AccountRef(id: "a", name: "BCA", currency: "IDR"),
            toBalanceAccount: nil
        ))
    }
    .padding(.horizontal, 16)
    .background(Color.budgieBackground)
}
