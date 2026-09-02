import SwiftUI
import UIKit

// MARK: - PDF export (§11) via UIGraphicsPDFRenderer

enum PDFExporter {

    static func generate(transactions: [Transaction], title: String) -> URL? {
        let pageRect = CGRect(x: 0, y: 0, width: 595, height: 842) // A4 portrait
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)
        let data = renderer.pdfData { ctx in
            ctx.beginPage()
            drawHeader(ctx: ctx, title: title, pageRect: pageRect)

            // Summary
            let summary = summarize(transactions)
            var y = drawSummary(ctx: ctx, summary: summary, pageRect: pageRect, y: 120)

            // Table
            y = drawTableHeader(ctx: ctx, pageRect: pageRect, y: y)
            let sorted = transactions.sorted { $0.date > $1.date }
            for txn in sorted {
                if y > pageRect.height - 60 {
                    ctx.beginPage()
                    y = drawTableHeader(ctx: ctx, pageRect: pageRect, y: 60)
                }
                y = drawRow(ctx: ctx, txn: txn, pageRect: pageRect, y: y)
            }
        }
        guard data.count > 0 else { return nil }
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("budgie-transactions-\(Int(Date().timeIntervalSince1970)).pdf")
        try? data.write(to: url)
        return url
    }

    private static func summarize(_ transactions: [Transaction]) -> (income: Double, expense: Double, transfer: Double) {
        var income = 0.0
        var expense = 0.0
        var transfer = 0.0
        for t in transactions {
            switch t.type {
            case .income: income += t.amount
            case .expense: expense += t.amount
            case .transfer: transfer += t.amount
            }
        }
        return (income, expense, transfer)
    }

    private static func drawHeader(ctx: UIGraphicsPDFRendererContext, title: String, pageRect: CGRect) {
        let attrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 22, weight: .bold),
            .foregroundColor: UIColor.black
        ]
        title.draw(at: CGPoint(x: 40, y: 40), withAttributes: attrs)

        let subtitle = "Budgie · Generated \(formatDate(Date()))"
        let subAttrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 12),
            .foregroundColor: UIColor.gray
        ]
        subtitle.draw(at: CGPoint(x: 40, y: 72), withAttributes: subAttrs)
    }

    private static func drawSummary(ctx: UIGraphicsPDFRendererContext,
                                    summary: (income: Double, expense: Double, transfer: Double),
                                    pageRect: CGRect, y: CGFloat) -> CGFloat {
        let attrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 12, weight: .medium),
            .foregroundColor: UIColor.black
        ]
        let lines = [
            "Income: \(formatRupiah(summary.income))",
            "Expense: \(formatRupiah(summary.expense))",
            "Transfer: \(formatRupiah(summary.transfer))"
        ]
        var cursor = y
        for line in lines {
            line.draw(at: CGPoint(x: 40, y: cursor), withAttributes: attrs)
            cursor += 18
        }
        return cursor + 14
    }

    private static func drawTableHeader(ctx: UIGraphicsPDFRendererContext, pageRect: CGRect, y: CGFloat) -> CGFloat {
        let headerAttrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 11, weight: .bold),
            .foregroundColor: UIColor.gray
        ]
        drawCell("Name", x: 40, width: 150, y: y, attrs: headerAttrs)
        drawCell("Category", x: 190, width: 120, y: y, attrs: headerAttrs)
        drawCell("Account", x: 310, width: 110, y: y, attrs: headerAttrs)
        drawCell("Date", x: 420, width: 70, y: y, attrs: headerAttrs)
        drawCell("Amount", x: 490, width: 65, y: y, attrs: headerAttrs, right: true)

        let line = UIBezierPath()
        line.move(to: CGPoint(x: 40, y: y + 18))
        line.addLine(to: CGPoint(x: 555, y: y + 18))
        line.lineWidth = 0.5
        UIColor.lightGray.setStroke()
        line.stroke()
        return y + 30
    }

    private static func drawRow(ctx: UIGraphicsPDFRendererContext, txn: Transaction, pageRect: CGRect, y: CGFloat) -> CGFloat {
        let rowAttrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 11),
            .foregroundColor: UIColor.black
        ]
        drawCell(txn.name, x: 40, width: 150, y: y, attrs: rowAttrs)
        drawCell(Categories.label(txn.category), x: 190, width: 120, y: y, attrs: rowAttrs)
        drawCell(txn.balanceAccount?.name ?? "Deleted account", x: 310, width: 110, y: y, attrs: rowAttrs)
        drawCell(formatDate(txn.date), x: 420, width: 70, y: y, attrs: rowAttrs)
        drawCell(signedRupiah(signedAmount(txn)), x: 490, width: 65, y: y, attrs: rowAttrs, right: true)
        return y + 18
    }

    private static func signedAmount(_ txn: Transaction) -> Double {
        txn.type == .expense ? -txn.amount : txn.amount
    }

    private static func drawCell(_ text: String, x: CGFloat, width: CGFloat, y: CGFloat,
                                 attrs: [NSAttributedString.Key: Any], right: Bool = false) {
        let size = text.size(withAttributes: attrs)
        let drawX = right ? x + width - size.width : x
        text.draw(at: CGPoint(x: drawX, y: y), withAttributes: attrs)
    }
}

// MARK: - Export UI (scopes: All / Filtered / Date range)

struct PDFExportView: View {
    var transactions: [Transaction]

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
        case .all: return transactions
        case .filtered: return transactions
        case .range:
            return transactions.filter {
                let day = Calendar.current.startOfDay(for: $0.date)
                return day >= Calendar.current.startOfDay(for: fromDate)
                    && day <= Calendar.current.startOfDay(for: toDate)
            }
        }
    }

    var body: some View {
        VStack(spacing: 16) {
            Text("Export PDF")
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(Color.budgieTextPrimary)
            Text("\(scoped.count) transactions included")
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)

            VStack(spacing: 0) {
                ForEach(Scope.allCases, id: \.self) { s in
                    Button {
                        scope = s
                    } label: {
                        HStack {
                            Text(s.rawValue)
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(Color.budgieTextPrimary)
                            Spacer()
                            if scope == s {
                                Image(systemName: "checkmark.circle.fill")
.foregroundStyle(Color.budgieBrand)
                            }
                        }
                        .padding(.vertical, 12)
                    }
                    .buttonStyle(PlainButtonStyle())
                    if s != Scope.allCases.last {
                        Divider().overlay(Color.budgieHairline)
                    }
                }
            }
            .padding(.horizontal, 16)
            .background(Color.budgieInsetSurface)
            .clipShape(.rect(cornerRadius: 20))

            if scope == .range {
                HStack {
                    DatePicker("From", selection: $fromDate, displayedComponents: .date)
                    DatePicker("To", selection: $toDate, in: fromDate..., displayedComponents: .date)
                }
                .font(.system(size: 14))
            }

            if let errorMessage {
                ErrorBanner(message: errorMessage)
            }

            Button {
                generate()
            } label: {
                Text("Generate PDF")
            }
            .buttonStyle(.budgieSuccess(height: 46, expanded: true))
        }
        .padding(20)
        .sheet(item: $shareURL) { url in
            ShareSheetView(url: url)
                .presentationDetents([.medium])
        }
    }

    private func generate() {
        guard let url = PDFExporter.generate(transactions: scoped,
                                             title: "Transactions — \(scope.rawValue)") else {
            errorMessage = "Could not generate the PDF."
            return
        }
        shareURL = url
    }
}

struct ShareSheetView: View {
    var url: URL
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.richtext")
                .font(.system(size: 40))
                .foregroundStyle(Color.budgieBrand)
            Text("PDF ready")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(Color.budgieTextPrimary)
            Text(url.lastPathComponent)
                .font(.system(size: 13))
                .foregroundStyle(Color.budgieTextSecondary)
            ShareLink(item: url) {
                Text("Share or Save PDF")
            }
            .buttonStyle(.budgieSuccess(height: 46, expanded: true))
            Button("Close") { dismiss() }
                .buttonStyle(.budgieOutline(height: 46))
        }
        .padding(24)
        .presentationBackground(.ultraThinMaterial)
    }
}

extension URL: @retroactive Identifiable {
    public var id: String { absoluteString }
}