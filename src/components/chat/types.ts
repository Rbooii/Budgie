export type ChatAccountsResult = {
  totalBalance: number;
  currency: string;
  accounts: { id: string; name: string; type: string; balance: number }[];
};

export type ChatTransactionsResult = {
  count: number;
  items: {
    id: string;
    name: string;
    amount: number;
    type: string;
    category: string;
    date: string;
    adminFee: number;
    account: string | null;
    toAccount: string | null;
  }[];
};

export type ChatBudgetsResult = {
  budgets: {
    id: string;
    category: string;
    categoryLabel: string;
    amount: number;
    periodDays: number;
    spent: number;
  }[];
};

export type ChatSubscriptionsResult = {
  subscriptions: {
    id: string;
    name: string;
    amount: number;
    category: string;
    categoryLabel: string;
    periodDays: number;
    active: boolean;
    nextBillingDate: string;
  }[];
};

export type ChatInsightsResult = {
  netWorth: number;
  monthIncome: number;
  monthExpense: number;
  topCategories: { category: string; amount: number }[];
};

export type ChatOverviewResult = {
  asOf: string;
  currency: string;
  netWorth: number;
  accounts: { id: string; name: string; type: string; balance: number }[];
  month: {
    label: string;
    income: number;
    expense: number;
    transferFees: number;
    net: number;
    savingsRate: number;
    transactionCount: number;
  };
  budgets: {
    total: number;
    overCount: number;
    items: ChatBudgetStatusRow[];
  };
  upcoming: {
    withinDays: number;
    total: number;
    items: Omit<ChatUpcomingBill, "nextBillingDate"> & { nextBillingDate: string }[];
  };
  topCategories: {
    category: string;
    categoryLabel: string;
    amount: number;
    count: number;
    share: number;
  }[];
  recent: {
    name: string;
    amount: number;
    type: string;
    category: string;
    categoryLabel: string;
    date: string;
    account: string | null;
  }[];
};

export type ChatCashflowTrendResult = {
  currency: string;
  months: {
    month: string;
    label: string;
    income: number;
    expense: number;
    transferFees: number;
    net: number;
  }[];
  totals: {
    income: number;
    expense: number;
    transferFees: number;
    net: number;
  };
  averageNet: number;
  bestMonth: string | null;
  worstMonth: string | null;
};

export type ChatSpendingBreakdownResult = {
  currency: string;
  groupBy: "category" | "merchant";
  from: string;
  to: string;
  total: number;
  transactionCount: number;
  items: {
    key: string;
    label: string;
    amount: number;
    count: number;
    share: number;
    previousAmount: number;
    deltaPct: number | null;
    budget: number | null;
    budgetSpent: number | null;
  }[];
};

export type ChatNetWorthHistoryResult = {
  currency: string;
  netWorth: number;
  change: number;
  series: { month: string; label: string; value: number; change: number }[];
};

export type ChatBudgetStatusRow = {
  id: string;
  category: string;
  categoryLabel: string;
  periodDays: number;
  period: string;
  limit: number;
  spent: number;
  remaining: number;
  over: boolean;
  spentPct: number;
  daysElapsed: number;
  projectedSpend: number;
  projectedOver: boolean;
};

export type ChatBudgetStatusResult = {
  currency: string;
  budgets: ChatBudgetStatusRow[];
};

export type ChatUpcomingBill = {
  id: string;
  name: string;
  amount: number;
  category: string;
  categoryLabel: string;
  period: string;
  nextBillingDate: string;
};

export type ChatUpcomingBillsResult = {
  currency: string;
  withinDays: number;
  total: number;
  items: ChatUpcomingBill[];
};

export type ChatLargestTransactionsResult = {
  currency: string;
  from: string;
  to: string;
  items: {
    id: string;
    name: string;
    amount: number;
    type: string;
    category: string;
    categoryLabel: string;
    date: string;
    adminFee: number;
    account: string | null;
    toAccount: string | null;
  }[];
};

export type ChatBudgetMutationResult =
  | {
      ok: true;
      budget: {
        id: string;
        category: string;
        categoryLabel: string;
        amount: number;
        periodDays: number;
        period: string;
      };
    }
  | { ok: false; error: string };

export type ChatSubscriptionMutationResult =
  | {
      ok: true;
      subscription: {
        id: string;
        name: string;
        amount: number;
        category: string;
        categoryLabel: string;
        periodDays: number;
        period: string;
        nextBillingDate: string;
      };
    }
  | { ok: false; error: string };

export type ChatCreateTransactionResult =
  | {
      ok: true;
      transaction: {
        id: string;
        name: string;
        amount: number;
        type: string;
        category: string;
        date: string;
        account: string | null;
      };
    }
  | { ok: false; error: string };