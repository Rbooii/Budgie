//
//  Formatters.swift
//  Budgie
//
//  Money, date and time formatting shared across screens.
//

import Foundation

// MARK: - Money

/// "1250000" -> "Rp 1.200.000" (id-ID grouping, no fraction digits).
func formatRupiah(_ value: Double) -> String {
    "Rp \(formatNumber(value))"
}

/// "1250000" -> "1.200.000" (no currency prefix).
func formatNumber(_ value: Double) -> String {
    let nf = NumberFormatter()
    nf.locale = Locale(identifier: "id_ID")
    nf.numberStyle = .decimal
    nf.maximumFractionDigits = 0
    return nf.string(from: NSNumber(value: value)) ?? String(Int(value))
}

/// "+Rp 1.234.567" / "-Rp 100.000"
func signedRupiah(_ value: Double) -> String {
    let amount = formatRupiah(abs(value))
    return value >= 0 ? "+\(amount)" : "-\(amount)"
}

/// "1,25 jt" — compact millions for chart centers.
func formatJuta(_ value: Double) -> String {
    let nf = NumberFormatter()
    nf.locale = Locale(identifier: "id_ID")
    nf.numberStyle = .decimal
    nf.maximumFractionDigits = 2
    let formatted = nf.string(from: NSNumber(value: value / 1_000_000)) ?? String(value / 1_000_000)
    return "\(formatted) jt"
}

/// "+24%" / "-3,5%"
func signedPercent(_ value: Double) -> String {
    let nf = NumberFormatter()
    nf.locale = Locale(identifier: "id_ID")
    nf.numberStyle = .decimal
    nf.maximumFractionDigits = 1
    let formatted = nf.string(from: NSNumber(value: abs(value))) ?? String(abs(value))
    return value >= 0 ? "+\(formatted)%" : "-\(formatted)%"
}

// MARK: - Dates

private let sectionDateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US")
    f.dateFormat = "d MMMM"
    return f
}()

private let monthYearFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US")
    f.dateFormat = "MMM yyyy"
    return f
}()

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

func formatMonthYear(_ date: Date) -> String {
    monthYearFormatter.string(from: date)
}

/// "13 Sep 2026"
func formatDate(_ date: Date) -> String {
    dayFormatter.string(from: date)
}

/// "1:30 pm"
func formatTime(_ date: Date) -> String {
    timeFormatter.string(from: date).lowercased()
}

/// "Today" / "Yesterday" / "11 September" (year appended outside the current year).
func transactionSectionLabel(_ date: Date) -> String {
    if isSameDay(date, Date()) { return "Today" }
    if let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: startOfToday()),
       isSameDay(date, yesterday) {
        return "Yesterday"
    }
    if isSameYear(date, Date()) {
        return sectionDateFormatter.string(from: date)
    }
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US")
    f.dateFormat = "d MMMM yyyy"
    return f.string(from: date)
}

// MARK: - Range helpers

func startOfToday() -> Date {
    Calendar.current.startOfDay(for: Date())
}

func startOfWeek() -> Date {
    let calendar = Calendar.current
    let now = Date()
    let weekday = calendar.component(.weekday, from: now)
    let daysFromMonday = (weekday - 2 + 7) % 7
    return calendar.date(byAdding: .day, value: -daysFromMonday, to: calendar.startOfDay(for: now))
        ?? calendar.startOfDay(for: now)
}

func startOfMonth() -> Date {
    let calendar = Calendar.current
    let components = calendar.dateComponents([.year, .month], from: Date())
    return calendar.date(from: components) ?? Date()
}

func periodStartDate(_ days: Int) -> Date {
    let calendar = Calendar.current
    guard let start = calendar.date(byAdding: .day, value: -days, to: Date()) else { return Date() }
    return calendar.startOfDay(for: start)
}

/// Calendar-aligned start of a budget period (weekly = Monday, monthly = 1st,
/// daily = today, custom = rolling N days).
func budgetPeriodStart(_ days: Int) -> Date {
    switch days {
    case 7: return startOfWeek()
    case 30: return startOfMonth()
    case 1: return startOfToday()
    default: return periodStartDate(days)
    }
}

// MARK: - Period labels

func periodLabel(_ days: Int) -> String {
    switch days {
    case 1: return "Daily"
    case 7: return "Weekly"
    case 30: return "Monthly"
    case 365: return "Yearly"
    default: return "Every \(days) days"
    }
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
