export function periodLabel(periodDays: number): string {
  if (periodDays === 1) return "Daily";
  if (periodDays === 7) return "Weekly";
  if (periodDays === 30) return "Monthly";
  if (periodDays === 365) return "Yearly";
  return `Every ${periodDays} days`;
}

export function periodStartDate(periodDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - periodDays);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function nextBillingDate(startDate: Date | string, periodDays: number): Date {
  const now = new Date();
  const start = typeof startDate === "string" ? new Date(startDate) : new Date(startDate);
  if (start.getTime() >= now.getTime()) return start;
  const elapsedMs = now.getTime() - start.getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const periodsElapsed = Math.floor(elapsedDays / periodDays);
  const next = new Date(start);
  next.setDate(next.getDate() + (periodsElapsed + 1) * periodDays);
  return next;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
