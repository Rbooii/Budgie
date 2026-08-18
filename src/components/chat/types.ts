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