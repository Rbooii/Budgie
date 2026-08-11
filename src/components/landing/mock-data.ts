import type { TransactionRow } from "@/components/transaction-item";
import type { SpendingStream, SpendingStreamsBudget } from "@/components/spending-streams-chart";

export const MOCK_SPENDING_STREAMS: SpendingStream[] = [
  { category: "FoodAndDrink", spent: 1_240_000 },
  { category: "Transportation", spent: 680_000 },
  { category: "Shopping", spent: 540_000 },
  { category: "Entertainment", spent: 320_000 },
  { category: "Utilities", spent: 280_000 },
];

export const MOCK_SPENDING_BUDGETS: SpendingStreamsBudget[] = [
  { category: "FoodAndDrink", amount: 1_500_000 },
  { category: "Transportation", amount: 800_000 },
  { category: "Shopping", amount: 600_000 },
  { category: "Entertainment", amount: 400_000 },
  { category: "Utilities", amount: 350_000 },
];

export const MOCK_TRANSACTIONS: TransactionRow[] = [
  {
    id: "m1",
    name: "Monthly Salary",
    amount: 8_000_000,
    type: "income",
    category: "Salary",
    date: "2026-12-01T09:00:00.000Z",
    adminFee: 0,
    balanceAccountId: "a1",
    toBalanceAccountId: null,
    balanceAccount: { id: "a1", name: "BCA Checking", currency: "IDR" },
    toBalanceAccount: null,
  },
  {
    id: "m2",
    name: "Groceries",
    amount: 184_500,
    type: "expense",
    category: "FoodAndDrink",
    date: "2026-12-03T13:24:00.000Z",
    adminFee: 0,
    balanceAccountId: "a1",
    toBalanceAccountId: null,
    balanceAccount: { id: "a1", name: "BCA Checking", currency: "IDR" },
    toBalanceAccount: null,
  },
  {
    id: "m3",
    name: "Move to Savings",
    amount: 1_500_000,
    type: "transfer",
    category: "Savings",
    date: "2026-12-05T19:10:00.000Z",
    adminFee: 0,
    balanceAccountId: "a1",
    toBalanceAccountId: "a2",
    balanceAccount: { id: "a1", name: "BCA Checking", currency: "IDR" },
    toBalanceAccount: { id: "a2", name: "GoPay", currency: "IDR" },
  },
  {
    id: "m4",
    name: "Ride to Office",
    amount: 28_000,
    type: "expense",
    category: "Transportation",
    date: "2026-12-06T08:05:00.000Z",
    adminFee: 0,
    balanceAccountId: "a2",
    toBalanceAccountId: null,
    balanceAccount: { id: "a2", name: "GoPay", currency: "IDR" },
    toBalanceAccount: null,
  },
];

/**
 * The live capture feed — a circular pool of transactions the bento's
 * "Capture" preview walks through. Every `LIVE_TICK_MS` the window slides by
 * one, so a fresh row enters at the top. The first three items are the same
 * as `MOCK_TRANSACTIONS` so the initial render is stable and familiar.
 */
export const MOCK_LIVE_TRANSACTIONS: TransactionRow[] = [
  MOCK_TRANSACTIONS[0],
  MOCK_TRANSACTIONS[1],
  MOCK_TRANSACTIONS[2],
  {
    id: "lv1",
    name: "Freelance Payout",
    amount: 2_400_000,
    type: "income",
    category: "Freelance",
    date: "2026-12-08T11:42:00.000Z",
    adminFee: 0,
    balanceAccountId: "a1",
    toBalanceAccountId: null,
    balanceAccount: { id: "a1", name: "BCA Checking", currency: "IDR" },
    toBalanceAccount: null,
  },
  {
    id: "lv2",
    name: "Spotify",
    amount: 54_990,
    type: "expense",
    category: "Entertainment",
    date: "2026-12-08T08:15:00.000Z",
    adminFee: 0,
    balanceAccountId: "a2",
    toBalanceAccountId: null,
    balanceAccount: { id: "a2", name: "GoPay", currency: "IDR" },
    toBalanceAccount: null,
  },
  {
    id: "lv3",
    name: "Coffee",
    amount: 38_000,
    type: "expense",
    category: "FoodAndDrink",
    date: "2026-12-08T07:20:00.000Z",
    adminFee: 0,
    balanceAccountId: "a3",
    toBalanceAccountId: null,
    balanceAccount: { id: "a3", name: "Cash", currency: "IDR" },
    toBalanceAccount: null,
  },
  {
    id: "lv4",
    name: "Pay Savings",
    amount: 500_000,
    type: "transfer",
    category: "Savings",
    date: "2026-12-07T10:00:00.000Z",
    adminFee: 0,
    balanceAccountId: "a1",
    toBalanceAccountId: "a2",
    balanceAccount: { id: "a1", name: "BCA Checking", currency: "IDR" },
    toBalanceAccount: { id: "a2", name: "GoPay", currency: "IDR" },
  },
  {
    id: "lv5",
    name: "Refund",
    amount: 120_000,
    type: "income",
    category: "Refund",
    date: "2026-12-07T16:05:00.000Z",
    adminFee: 0,
    balanceAccountId: "a1",
    toBalanceAccountId: null,
    balanceAccount: { id: "a1", name: "BCA Checking", currency: "IDR" },
    toBalanceAccount: null,
  },
];

/** Interval at which the live previews advance (ms). */
export const LIVE_TICK_MS = 4000;

/**
 * The live spending scenario — a base month plus an ordered list of expense
 * events. The "Automate" preview starts at the base and accumulates one event
 * per tick, then loops back to the base (a month in miniature).
 */
export const MOCK_LIVE_SPENDING_BASE: SpendingStream[] = [
  { category: "FoodAndDrink", spent: 1_240_000 },
  { category: "Transportation", spent: 680_000 },
  { category: "Shopping", spent: 540_000 },
  { category: "Entertainment", spent: 320_000 },
  { category: "Utilities", spent: 280_000 },
];

export const MOCK_LIVE_EXPENSE_EVENTS: Array<{
  category: string;
  amount: number;
}> = [
  { category: "FoodAndDrink", amount: 86_500 },
  { category: "Transportation", amount: 24_000 },
  { category: "Shopping", amount: 310_000 },
  { category: "Entertainment", amount: 54_990 },
  { category: "FoodAndDrink", amount: 42_800 },
  { category: "Transportation", amount: 62_500 },
];

export const MOCK_LIVE_SPENDING_BUDGETS: SpendingStreamsBudget[] = [
  { category: "FoodAndDrink", amount: 1_500_000 },
  { category: "Transportation", amount: 800_000 },
  { category: "Shopping", amount: 900_000 },
  { category: "Entertainment", amount: 400_000 },
  { category: "Utilities", amount: 350_000 },
];
