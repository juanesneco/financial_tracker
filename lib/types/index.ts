import type { Database } from "./database";

// ─── Row Types (shorthand) ───────────────────────────────────────────────────

type Tables = Database["public"]["Tables"];

export type Profile = Tables["ft_profiles"]["Row"];
export type Category = Tables["ft_categories"]["Row"];
export type Subcategory = Tables["ft_subcategories"]["Row"];
export type Expense = Tables["ft_expenses"]["Row"];
export type Card = Tables["ft_cards"]["Row"];
export type Deposit = Tables["ft_deposits"]["Row"];
export type Subscription = Tables["ft_subscriptions"]["Row"];
export type Budget = Tables["ft_budgets"]["Row"];
export type IncomeSource = Tables["ft_income_sources"]["Row"];
export type IncomeRecord = Tables["ft_income_records"]["Row"];

// ─── Insert Types ────────────────────────────────────────────────────────────

export type ExpenseInsert = Tables["ft_expenses"]["Insert"];
export type DepositInsert = Tables["ft_deposits"]["Insert"];
export type CardInsert = Tables["ft_cards"]["Insert"];
export type SubscriptionInsert = Tables["ft_subscriptions"]["Insert"];
export type BudgetInsert = Tables["ft_budgets"]["Insert"];
export type IncomeSourceInsert = Tables["ft_income_sources"]["Insert"];
export type IncomeRecordInsert = Tables["ft_income_records"]["Insert"];

// ─── Update Types ────────────────────────────────────────────────────────────

export type ExpenseUpdate = Tables["ft_expenses"]["Update"];
export type DepositUpdate = Tables["ft_deposits"]["Update"];
export type CardUpdate = Tables["ft_cards"]["Update"];
export type SubscriptionUpdate = Tables["ft_subscriptions"]["Update"];
export type BudgetUpdate = Tables["ft_budgets"]["Update"];
export type IncomeSourceUpdate = Tables["ft_income_sources"]["Update"];
export type IncomeRecordUpdate = Tables["ft_income_records"]["Update"];

// ─── App Types ───────────────────────────────────────────────────────────────

export type PaymentMethod = "card" | "cash";

export type TimeRange = "today" | "this_week" | "this_month" | "this_year" | "custom";

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface MonthYear {
  month: number; // 0-11
  year: number;
}

export interface CategoryTotal {
  category: Category;
  total: number;
  count: number;
}

export interface ExpenseWithCategory extends Expense {
  category?: Category;
  subcategory?: Subcategory;
  card?: Card;
}

export interface BudgetWithProgress extends Budget {
  category?: Category;
  subcategory?: Subcategory;
  spent: number;
  percentage: number;
}
