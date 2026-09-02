import SwiftUI

// MARK: - JSONValue helpers

extension JSONValue {
    var array: [JSONValue]? {
        if case .array(let a) = self { return a }
        return nil
    }

    var bool: Bool? {
        if case .bool(let b) = self { return b }
        return nil
    }

    subscript(_ key: String) -> JSONValue? {
        objectValue?[key]
    }

    var string: String? {
        stringValue
    }

    var number: Double? {
        numberValue
    }

    var description: String {
        switch self {
        case .null: return "null"
        case .bool(let b): return b ? "true" : "false"
        case .number(let n): return String(n)
        case .string(let s): return s
        case .array(let a): return a.map(\.description).joined(separator: ", ")
        case .object(let o): return o.values.map(\.description).joined(separator: ", ")
        }
    }
}

// MARK: - User bubble

struct ChatUserBubble: View {
    var text: String

    var body: some View {
        Text(text)
            .font(.system(size: 15))
            .foregroundStyle(Color.budgieTextPrimary)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color.budgieChatBubble)
            .clipShape(.rect(cornerRadius: 20))
            .frame(maxWidth: 300, alignment: .trailing)
    }
}

// MARK: - Assistant text

struct ChatAssistantText: View {
    var text: String

    var body: some View {
        Text(text)
            .font(.system(size: 15))
            .foregroundStyle(Color.budgieTextPrimary)
            .textSelection(.enabled)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Thinking block

struct ChatThinkingBlock: View {
    var part: UIPart
    @State private var expanded = false

    var body: some View {
        if case .reasoning(_, let text, let state) = part {
            let streaming = state == "streaming" || state == nil
            VStack(alignment: .leading, spacing: 8) {
                if streaming {
                    HStack(spacing: 8) {
                        ProgressView()
                            .controlSize(.small)
                            .tint(Color.budgieTextSecondary)
                        Text("Thinking…")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.budgieTextSecondary)
                    }
                } else {
                    Button {
                        withAnimation(.easeOut(duration: 0.2)) { expanded.toggle() }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: expanded ? "chevron.down" : "chevron.right")
                                .font(.system(size: 10, weight: .semibold))
                            Text("Thought for a moment")
                                .font(.system(size: 13, weight: .medium))
                            Spacer()
                        }
                        .foregroundStyle(Color.budgieTextSecondary)
                    }
                    .buttonStyle(PlainButtonStyle())

                    if expanded {
                        Text(text)
                            .font(.system(size: 13))
                            .monospaced()
                            .foregroundStyle(Color.budgieTextSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                            .transition(.opacity)
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color.budgieLandingGray)
            .clipShape(.rect(cornerRadius: 14))
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

// MARK: - Tool cards

struct ChatToolCard: View {
    var part: UIPart

    private var running: Bool {
        if case .tool(_, _, let state, _, _, _) = part {
            return state == "input-streaming" || state == "input-available"
        }
        return false
    }

    private var failed: Bool {
        if case .tool(_, _, let state, _, _, let err) = part {
            return state == "output-error" || err != nil
        }
        return false
    }

    var body: some View {
        if case .tool(let name, _, let state, let input, let output, let errorText) = part {
            if running {
                HStack(spacing: 8) {
                    ProgressView()
                        .controlSize(.small)
                        .tint(Color.budgieBrand)
                    Text(runningLabel(name))
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color.budgieTextSecondary)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(Color.budgieSurfaceGray)
                .clipShape(Capsule())
                .frame(maxWidth: .infinity, alignment: .leading)
            } else if failed {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 12, weight: .semibold))
                    Text(errorText ?? "Something went wrong")
                        .font(.system(size: 13, weight: .medium))
                        .fixedSize(horizontal: false, vertical: true)
                }
                .foregroundStyle(Color.budgieExpense)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.budgieExpensePastel.opacity(0.45))
                .clipShape(.rect(cornerRadius: 20))
            } else if let output {
                toolResult(name: name, output: output, state: state)
            } else if let input {
                toolResult(name: name, output: input, state: state)
            }
        }
    }

    @ViewBuilder
    private func toolResult(name: String, output: JSONValue, state: String) -> some View {
        let showResult = state == "output-available" || state == "done"
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: toolIcon(name))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.budgieBrand)
                Text(toolTitle(name))
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.budgieTextPrimary)
                Spacer()
            }
            if showResult {
                switch name {
                case "get_balance_accounts": accountsContent(output)
                case "get_transactions": transactionsContent(output)
                case "get_budgets": budgetsContent(output)
                case "get_subscriptions": subscriptionsContent(output)
                case "get_insights": insightsContent(output)
                case "create_transaction": createTransactionContent(output)
                default:
                    Text(output.description)
                        .font(.system(size: 13))
                        .foregroundStyle(Color.budgieTextSecondary)
                }
            }
        }
        .padding(14)
        .background(Color.budgieCard)
        .clipShape(.rect(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.budgieHairline, lineWidth: 1))
        .frame(maxWidth: 300, alignment: .leading)
    }

    // MARK: Tool contents

    @ViewBuilder
    private func accountsContent(_ output: JSONValue) -> some View {
        if let total = output["totalBalance"]?.number {
            VStack(alignment: .leading, spacing: 8) {
                Text("Total balance")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.budgieTextTertiary)
                Text(formatRupiah(total))
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(Color.budgieTextPrimary)
            }
        }
        if let accounts = output["accounts"]?.array {
            ForEach(Array(accounts.enumerated()), id: \.offset) { _, account in
                row(label: account["name"]?.string ?? "Account",
                    value: formatRupiah(account["balance"]?.number ?? 0),
                    tint: .budgieTextPrimary)
            }
        }
    }

    @ViewBuilder
    private func transactionsContent(_ output: JSONValue) -> some View {
        if let count = output["count"]?.number, count == 0, let items = output["items"]?.array, items.isEmpty {
            Text("No transactions found.")
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
        } else if let items = output["items"]?.array {
            let visible = items.prefix(8)
            ForEach(Array(visible.enumerated()), id: \.offset) { _, item in
                let amount = item["amount"]?.number ?? 0
                let type = item["type"]?.string ?? "expense"
                let tint: Color = type == "income" ? .budgieIncome : (type == "transfer" ? .budgieTransfer : .budgieExpense)
                HStack {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(item["name"]?.string ?? "—")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text("\(Categories.label(item["category"]?.string ?? "")) · \(item["account"]?.string ?? "Deleted account")")
                            .font(.system(size: 11))
                            .foregroundStyle(Color.budgieTextTertiary)
                    }
                    Spacer()
                    Text(formatRupiahCompact(amount))
                        .font(.system(size: 13, weight: .semibold))
                        .monospacedDigit()
                        .foregroundStyle(tint)
                }
            }
            if items.count > 8 {
                Text("+\(items.count - 8) more")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color.budgieTextSecondary)
            }
        }
    }

    @ViewBuilder
    private func budgetsContent(_ output: JSONValue) -> some View {
        if let budgets = output["budgets"]?.array {
            if budgets.isEmpty {
                Text("No budgets yet.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.budgieTextSecondary)
            } else {
                ForEach(Array(budgets.enumerated()), id: \.offset) { _, budget in
                    let amount = budget["amount"]?.number ?? 0
                    let spent = budget["spent"]?.number ?? 0
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(budget["categoryLabel"]?.string ?? budget["category"]?.string ?? "—")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Color.budgieTextPrimary)
                            Spacer()
                            Text("\(formatRupiahCompact(spent)) / \(formatRupiahCompact(amount))")
                                .font(.system(size: 12, weight: .semibold))
                                .monospacedDigit()
                                .foregroundStyle(spent > amount ? Color.budgieExpense : Color.budgieTextSecondary)
                        }
                        ProgressTrack(progress: amount > 0 ? spent / amount : 0, isOver: spent > amount, height: 6)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func subscriptionsContent(_ output: JSONValue) -> some View {
        if let subscriptions = output["subscriptions"]?.array {
            if subscriptions.isEmpty {
                Text("No subscriptions yet.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.budgieTextSecondary)
            } else {
                ForEach(Array(subscriptions.enumerated()), id: \.offset) { _, sub in
                    HStack {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(sub["name"]?.string ?? "—")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Color.budgieTextPrimary)
                            Text("Next \(formatDate(isoDate(sub["nextBillingDate"]?.string)))")
                                .font(.system(size: 11))
                                .foregroundStyle(Color.budgieTextTertiary)
                        }
                        Spacer()
                        Text(formatRupiahCompact(sub["amount"]?.number ?? 0))
                            .font(.system(size: 13, weight: .semibold))
                            .monospacedDigit()
                            .foregroundStyle(Color.budgieTransfer)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func insightsContent(_ output: JSONValue) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(formatRupiah(output["netWorth"]?.number ?? 0))
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(Color.budgieTextPrimary)
            HStack(spacing: 8) {
                insightTile(icon: SFIcons.income, tint: .budgieIncome, pastel: .budgieIncomePastel,
                            label: "Income", value: output["monthIncome"]?.number ?? 0)
                insightTile(icon: SFIcons.expense, tint: .budgieExpense, pastel: .budgieExpensePastel,
                            label: "Expense", value: output["monthExpense"]?.number ?? 0)
            }
            if let top = output["topCategories"]?.array, !top.isEmpty {
                VStack(spacing: 6) {
                    ForEach(Array(top.prefix(5).enumerated()), id: \.offset) { _, cat in
                        HStack {
                            Text(Categories.label(cat["category"]?.string ?? ""))
                                .font(.system(size: 12))
                                .foregroundStyle(Color.budgieTextSecondary)
                            Spacer()
                            Text(formatRupiahCompact(cat["amount"]?.number ?? 0))
                                .font(.system(size: 12, weight: .semibold))
                                .monospacedDigit()
                                .foregroundStyle(Color.budgieTextPrimary)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func createTransactionContent(_ output: JSONValue) -> some View {
        if let ok = output["ok"]?.bool, ok {
            HStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(Color.budgieIncome)
                if let txn = output["transaction"] {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(txn["name"]?.string ?? "Transaction")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Text("\(formatRupiahCompact(txn["amount"]?.number ?? 0)) · \(txn["account"]?.string ?? "")")
                            .font(.system(size: 11))
                            .foregroundStyle(Color.budgieTextTertiary)
                    }
                }
            }
        } else if let error = output["error"]?.string {
            HStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.budgieExpense)
                Text(error)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.budgieExpense)
            }
        }
    }

    private func insightTile(icon: String, tint: Color, pastel: Color, label: String, value: Double) -> some View {
        HStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(pastel.opacity(0.32))
                Image(systemName: icon)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(tint)
            }
            .frame(width: 26, height: 26)
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.system(size: 10))
                    .foregroundStyle(Color.budgieTextTertiary)
                Text(formatRupiahCompact(value))
                    .font(.system(size: 12, weight: .semibold))
                    .monospacedDigit()
                    .foregroundStyle(tint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func row(label: String, value: String, tint: Color) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.budgieTextPrimary)
                .lineLimit(1)
            Spacer()
            Text(value)
                .font(.system(size: 13, weight: .semibold))
                .monospacedDigit()
                .foregroundStyle(tint)
        }
    }

    private func isoDate(_ raw: String?) -> Date {
        guard let raw else { return Date() }
        return DateFormatters.iso.date(from: raw) ?? DateFormatters.isoNoFraction.date(from: raw) ?? Date()
    }

    private func toolIcon(_ name: String) -> String {
        switch name {
        case "get_balance_accounts": return "wallet.pass"
        case "get_transactions": return "arrow.right.arrow.left"
        case "get_budgets": return "target"
        case "get_subscriptions": return "arrow.triangle.2.circlepath"
        case "get_insights": return "chart.pie"
        case "create_transaction": return "plus"
        default: return "sparkles"
        }
    }

    private func runningLabel(_ name: String) -> String {
        switch name {
        case "get_balance_accounts": return "Looking up your accounts…"
        case "get_transactions": return "Fetching your transactions…"
        case "get_budgets": return "Checking your budgets…"
        case "get_subscriptions": return "Looking up your subscriptions…"
        case "get_insights": return "Analyzing your money…"
        case "create_transaction": return "Adding the transaction…"
        default: return "Working…"
        }
    }

    private func toolTitle(_ name: String) -> String {
        switch name {
        case "get_balance_accounts": return "Accounts"
        case "get_transactions": return "Transactions"
        case "get_budgets": return "Budgets"
        case "get_subscriptions": return "Subscriptions"
        case "get_insights": return "Insights"
        case "create_transaction": return "Transaction"
        default: return "Tool"
        }
    }
}

// MARK: - Typing dots

struct TypingDots: View {
    @State private var animating = false

    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(Color.black.opacity(0.3))
                    .frame(width: 6, height: 6)
                    .opacity(animating ? 1 : 0.35)
                    .animation(
                        .easeInOut(duration: 0.4)
                            .repeatForever(autoreverses: true)
                            .delay(Double(index) * 0.2),
                        value: animating
                    )
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(Capsule().fill(Color.budgieSurfaceGray))
        .onAppear { animating = true }
    }
}