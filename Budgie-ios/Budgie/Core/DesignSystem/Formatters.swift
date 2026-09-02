import Foundation
import SwiftUI

// MARK: - Formatting (§6.4) — port of src/lib/format.ts + budget.ts

func formatRupiah(_ value: Double) -> String {
    let nf = NumberFormatter()
    nf.locale = Locale(identifier: "id_ID")
    nf.numberStyle = .decimal
    nf.minimumFractionDigits = 2
    nf.maximumFractionDigits = 2
    let formatted = nf.string(from: NSNumber(value: value)) ?? String(value)
    return "Rp \(formatted)"
}

func formatRupiahCompact(_ value: Double) -> String {
    let nf = NumberFormatter()
    nf.locale = Locale(identifier: "id_ID")
    nf.numberStyle = .decimal
    nf.maximumFractionDigits = 0
    let formatted = nf.string(from: NSNumber(value: value)) ?? String(value)
    return "Rp \(formatted)"
}

/// Signed rupiah: "+Rp 1.234.567" / "-Rp 100.000"
func signedRupiah(_ value: Double) -> String {
    let abs = formatRupiah(abs(value))
    return value >= 0 ? "+\(abs)" : "-\(abs)"
}

/// "+1,2%" style percent for the net-worth delta.
func signedPercent(_ value: Double) -> String {
    let nf = NumberFormatter()
    nf.locale = Locale(identifier: "id_ID")
    nf.numberStyle = .decimal
    nf.maximumFractionDigits = 1
    let formatted = nf.string(from: NSNumber(value: abs(value))) ?? String(abs(value))
    return value >= 0 ? "+\(formatted)%" : "-\(formatted)%"
}

/// Mil-style amount for the donut center: "1,25 jt", "-0,42 jt".
func formatJuta(_ value: Double) -> String {
    let juta = value / 1_000_000
    let nf = NumberFormatter()
    nf.locale = Locale(identifier: "id_ID")
    nf.numberStyle = .decimal
    nf.minimumFractionDigits = 0
    nf.maximumFractionDigits = 2
    let formatted = nf.string(from: NSNumber(value: juta)) ?? String(juta)
    return "\(formatted) jt"
}

/// Strip non-digits (keep leading minus), group with id-ID separators, no decimals.
func formatBalanceInput(_ raw: String) -> String {
    var cleaned = raw.replacingOccurrences(of: "[^0-9\\-]", with: "", options: .regularExpression)
    var isNegative = false
    if cleaned.hasPrefix("-") {
        isNegative = true
        cleaned.removeFirst()
    }
    cleaned = String(cleaned.prefix(15))
    let digits = cleaned.isEmpty ? "0" : cleaned
    let nf = NumberFormatter()
    nf.locale = Locale(identifier: "id_ID")
    nf.numberStyle = .decimal
    nf.maximumFractionDigits = 0
    let grouped = nf.string(from: NSNumber(value: Int(digits) ?? 0)) ?? digits
    return isNegative ? "-\(grouped)" : grouped
}

/// Raw number parsed from a balance-input string.
func parseBalanceInput(_ input: String) -> Double {
    let cleaned = input.replacingOccurrences(of: "[^0-9\\-]", with: "", options: .regularExpression)
    return Double(cleaned) ?? 0
}

private let dayFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "dd MMM yyyy"
    return f
}()

private let timeFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "h:mm a"
    return f
}()

private let monthYearFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "MMM yyyy"
    return f
}()

func formatDate(_ d: Date) -> String {
    dayFormatter.string(from: d)
}

func formatTime(_ d: Date) -> String {
    timeFormatter.string(from: d).lowercased()
}

func formatMonthYear(_ d: Date) -> String {
    monthYearFormatter.string(from: d)
}

// MARK: - Period helpers

func periodLabel(_ days: Int) -> String {
    switch days {
    case 1: return "Daily"
    case 7: return "Weekly"
    case 30: return "Monthly"
    case 365: return "Yearly"
    default: return "Every \(days) days"
    }
}

func nextBillingDate(_ start: Date, _ days: Int) -> Date {
    let cal = Calendar.current
    let now = Date()
    if start >= now { return start }
    let startDay = cal.startOfDay(for: start)
    let nowDay = cal.startOfDay(for: now)
    let elapsedDays = cal.dateComponents([.day], from: startDay, to: nowDay).day ?? 0
    guard elapsedDays > 0, days > 0 else { return start }
    let cycles = Int(ceil(Double(elapsedDays) / Double(days)))
    return cal.date(byAdding: .day, value: cycles * days, to: startDay) ?? start
}

func periodStartDate(_ days: Int) -> Date {
    let cal = Calendar.current
    let now = Date()
    guard let start = cal.date(byAdding: .day, value: -days, to: now) else { return now }
    return cal.startOfDay(for: start)
}

func startOfWeek() -> Date {
    let cal = Calendar.current
    let now = Date()
    // Monday as the first day of the week (getDay % 7 == 1 ⇒ Monday)
    let weekday = cal.component(.weekday, from: now) // 1 = Sunday ... 7 = Saturday
    let daysFromMonday = (weekday - 2 + 7) % 7
    return cal.date(byAdding: .day, value: -daysFromMonday, to: cal.startOfDay(for: now)) ?? cal.startOfDay(for: now)
}

/// Calendar-aligned start of a budget period. Monthly resets on the 1st, weekly
/// on Monday, daily at midnight; custom periods stay a rolling N-day window.
func budgetPeriodStart(_ days: Int) -> Date {
    switch days {
    case 7: return startOfWeek()
    case 30: return startOfMonth()
    case 1: return startOfToday()
    default: return periodStartDate(days)
    }
}

func startOfToday() -> Date {
    Calendar.current.startOfDay(for: Date())
}

func startOfMonth() -> Date {
    let cal = Calendar.current
    let comps = cal.dateComponents([.year, .month], from: Date())
    return cal.date(from: comps) ?? Date()
}

func startOfYear() -> Date {
    let cal = Calendar.current
    let comps = cal.dateComponents([.year], from: Date())
    return cal.date(from: comps) ?? Date()
}

func isSameDay(_ a: Date, _ b: Date) -> Bool {
    Calendar.current.isDate(a, inSameDayAs: b)
}

func isSameMonth(_ a: Date, _ b: Date) -> Bool {
    Calendar.current.isDate(a, equalTo: b, toGranularity: .month)
}

func isSameYear(_ a: Date, _ b: Date) -> Bool {
    Calendar.current.isDate(a, equalTo: b, toGranularity: .year)
}