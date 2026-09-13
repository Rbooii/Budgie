//
//  PDFExportSheet.swift
//  Budgie
//
//  Transactions PDF export (All / Filtered / Date range) + share sheet.
//

import SwiftUI
import UIKit

enum PDFExporter {
    static func generate(transactions: [Transaction], title: String) -> URL? {
        let pageRect = CGRect(x: 0, y: 0, width: 595, height: 842) // A4 portrait
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)
        let data = renderer.pdfData { context in
            context.beginPage()
            drawHeader(title: title, pageRect: pageRect)

            let summary = summarize(transactions)
            var y = drawSummary(summary, y: 120)

            y = drawTableHeader(y: y)
            for transaction in transactions.sorted(by: { $0.date > $1.date }) {
                if y > pageRect.height - 60 {
                    context.beginPage()
                    y = drawTableHeader(y: 60)
                }
                y = drawRow(transaction, y: y)
            }
        }
        guard !data.isEmpty else { return nil }
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("budgie-transactions-\(Int(Date().timeIntervalSince1970)).pdf")
        try? data.write(to: url)
        return url
    }

    private static func summarize(_ transactions: [Transaction]) -> (income: Double, expense: Double, transfer: Double) {
        var income = 0.0
        var expense = 0.0
        var transfer = 0.0
        for transaction in transactions {
            switch transaction.type {
            case .income: income += transaction.amount
            case .expense: expense += transaction.amount
            case .transfer: transfer += transaction.amount
            }
        }
        return (income, expense, transfer)
    }

    private static func drawHeader(title: String, pageRect: CGRect) {
        title.draw(at: CGPoint(x: 40, y: 40), withAttributes: [
            .font: UIFont.systemFont(ofSize: 22, weight: .bold),
            .foregroundColor: UIColor.black
        ])
        "Budgie · Generated \(formatDate(Date()))".draw(at: CGPoint(x: 40, y: 72), withAttributes: [
            .font: UIFont.systemFont(ofSize: 12),
            .foregroundColor: UIColor.gray
        ])
    }

    private static func drawSummary(_ summary: (income: Double, expense: Double, transfer: Double), y: CGFloat) -> CGFloat {
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 12, weight: .medium),
            .foregroundColor: UIColor.black
        ]
        var cursor = y
        for line in [
            "Income: \(formatRupiah(summary.income))",
            "Expense: \(formatRupiah(summary.expense))",
            "Transfer: \(formatRupiah(summary.transfer))"
        ] {
            line.draw(at: CGPoint(x: 40, y: cursor), withAttributes: attributes)
            cursor += 18
        }
        return cursor + 14
    }

    private static func drawTableHeader(y: CGFloat) -> CGFloat {
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 11, weight: .bold),
            .foregroundColor: UIColor.gray
        ]
        drawCell("Name", x: 40, width: 150, y: y, attributes: attributes)
        drawCell("Category", x: 190, width: 120, y: y, attributes: attributes)
        drawCell("Account", x: 310, width: 110, y: y, attributes: attributes)
        drawCell("Date", x: 420, width: 70, y: y, attributes: attributes)
        drawCell("Amount", x: 490, width: 65, y: y, attributes: attributes, right: true)

        let line = UIBezierPath()
        line.move(to: CGPoint(x: 40, y: y + 18))
        line.addLine(to: CGPoint(x: 555, y: y + 18))
        line.lineWidth = 0.5
        UIColor.lightGray.setStroke()
        line.stroke()
        return y + 30
    }

    private static func drawRow(_ transaction: Transaction, y: CGFloat) -> CGFloat {
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 11),
            .foregroundColor: UIColor.black
        ]
        let signed = transaction.type == .expense ? -transaction.amount : transaction.amount
        drawCell(transaction.name, x: 40, width: 150, y: y, attributes: attributes)
        drawCell(Categories.label(transaction.category), x: 190, width: 120, y: y, attributes: attributes)
        drawCell(transaction.balanceAccount?.name ?? "Deleted account", x: 310, width: 110, y: y, attributes: attributes)
        drawCell(formatDate(transaction.date), x: 420, width: 70, y: y, attributes: attributes)
        drawCell(signedRupiah(signed), x: 490, width: 65, y: y, attributes: attributes, right: true)
        return y + 18
    }

    private static func drawCell(_ text: String, x: CGFloat, width: CGFloat, y: CGFloat,
                                 attributes: [NSAttributedString.Key: Any], right: Bool = false) {
        let size = text.size(withAttributes: attributes)
        text.draw(at: CGPoint(x: right ? x + width - size.width : x, y: y), withAttributes: attributes)
    }
}

struct PDFExportSheet: View {
    var all: [Transaction]
    var filtered: [Transaction]

    @Environment(\.dismiss) private var dismiss
    @State private var scope: Scope = .all
    @State private var fromDate = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
    @State private var toDate = Date()
    @State private var shareURL: URL?
    @State private var errorMessage: String?

    enum Scope: String, CaseIterable, Hashable {
        case all = "All transactions"
        case filtered = "Filtered"
        case range = "Date range"
    }

    private var scoped: [Transaction] {
        switch scope {
        case .all: return all
        case .filtered: return filtered
        case .range:
            return all.filter {
                let day = Calendar.current.startOfDay(for: $0.date)
                return day >= Calendar.current.startOfDay(for: fromDate)
                    && day <= Calendar.current.startOfDay(for: toDate)
            }
        }
    }

    var body: some View {
        VStack(spacing: 16) {
            Text("Export PDF")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)
                .padding(.top, 8)

            Text("\(scoped.count) transactions included")
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)

            scopeCard

            if scope == .range {
                rangeCard
            }

            if let errorMessage {
                ErrorBanner(message: errorMessage)
            }

            Spacer(minLength: 0)

            CapsuleButton(title: "Generate PDF", action: generate)
        }
        .padding(20)
        .budgieDrawer()
        .sheet(item: $shareURL) { url in
            PDFShareSheet(url: url)
                .presentationDetents([.medium])
        }
    }

    private var scopeCard: some View {
        InsetCard {
            ForEach(Array(Scope.allCases.enumerated()), id: \.element) { index, option in
                if index > 0 {
                    Divider().overlay(Color.budgieHairline)
                }
                Button {
                    withAnimation(.easeOut(duration: 0.15)) { scope = option }
                } label: {
                    HStack {
                        Text(option.rawValue)
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.budgieTextPrimary)
                        Spacer()
                        if scope == option {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 18))
                                .foregroundStyle(Color.budgieBrand)
                        }
                    }
                    .padding(.vertical, 13)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var rangeCard: some View {
        InsetCard {
            HStack {
                Text("From")
                    .font(.system(size: 15))
                    .foregroundStyle(Color.budgieTextSecondary)
                Spacer()
                DatePicker("", selection: $fromDate, displayedComponents: .date)
                    .labelsHidden()
                    .tint(.budgieBrand)
            }
            .padding(.vertical, 6)

            Divider().overlay(Color.budgieHairline)

            HStack {
                Text("To")
                    .font(.system(size: 15))
                    .foregroundStyle(Color.budgieTextSecondary)
                Spacer()
                DatePicker("", selection: $toDate, in: fromDate..., displayedComponents: .date)
                    .labelsHidden()
                    .tint(.budgieBrand)
            }
            .padding(.vertical, 6)
        }
    }

    private func generate() {
        guard let url = PDFExporter.generate(transactions: scoped, title: "Transactions — \(scope.rawValue)") else {
            errorMessage = "Could not generate the PDF."
            return
        }
        shareURL = url
    }
}

struct PDFShareSheet: View {
    var url: URL

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.richtext")
                .font(.system(size: 40))
                .foregroundStyle(Color.budgieBrand)
            Text("PDF ready")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Color.budgieTextPrimary)
            Text(url.lastPathComponent)
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
                .lineLimit(1)

            ShareLink(item: url) {
                Text("Share or Save PDF")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(Color.budgieBrand, in: Capsule())
            }

            Button {
                dismiss()
            } label: {
                Text("Close")
                    .font(.headline)
                    .foregroundStyle(Color.budgieTextPrimary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(Color.budgieSurfaceGray, in: Capsule())
            }
            .buttonStyle(PressableButtonStyle())
        }
        .padding(24)
        .budgieDrawer()
    }
}

extension URL: @retroactive Identifiable {
    public var id: String { absoluteString }
}
