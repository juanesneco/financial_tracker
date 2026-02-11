import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ExpenseInsert,
  ExpenseUpdate,
  DepositInsert,
  CardInsert,
  CardUpdate,
  SubscriptionInsert,
  SubscriptionUpdate,
  BudgetInsert,
  BudgetUpdate,
  IncomeSourceInsert,
  IncomeSourceUpdate,
  IncomeRecordInsert,
  Profile,
} from "@/lib/types";

// The codebase uses `(supabase as any).from("ft_*")` pattern because
// Supabase client types don't recognize our custom views as writable tables.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(supabase: Client, userId: string) {
  return supabase.from("ft_profiles").select("*").eq("id", userId).single();
}

export async function updateProfile(supabase: Client, userId: string, updates: Partial<Profile>) {
  return supabase.from("ft_profiles").update(updates).eq("id", userId);
}

// ─── Categories & Subcategories ───────────────────────────────────────────────

export async function getCategories(supabase: Client) {
  return supabase.from("ft_categories").select("*").order("display_order");
}

export async function getSubcategories(supabase: Client) {
  return supabase.from("ft_subcategories").select("*").order("display_order");
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpenses(
  supabase: Client,
  options: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    paymentMethod?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  let query = supabase.from("ft_expenses").select("*", { count: "exact" });

  if (options.startDate) query = query.gte("date", options.startDate);
  if (options.endDate) query = query.lte("date", options.endDate);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.paymentMethod) query = query.eq("payment_method", options.paymentMethod);
  if (options.search) query = query.or(`title.ilike.%${options.search}%,note.ilike.%${options.search}%`);

  query = query.order("date", { ascending: false }).order("created_at", { ascending: false });

  if (options.limit) query = query.limit(options.limit);
  if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

  return query;
}

export async function getExpenseById(supabase: Client, id: string) {
  return supabase.from("ft_expenses").select("*").eq("id", id).single();
}

export async function insertExpense(supabase: Client, expense: ExpenseInsert) {
  return supabase.from("ft_expenses").insert(expense).select().single();
}

export async function updateExpense(supabase: Client, id: string, updates: ExpenseUpdate) {
  return supabase.from("ft_expenses").update(updates).eq("id", id).select().single();
}

export async function deleteExpense(supabase: Client, id: string) {
  return supabase.from("ft_expenses").delete().eq("id", id);
}

// ─── Deposits ─────────────────────────────────────────────────────────────────

export async function getDeposits(
  supabase: Client,
  options: { startDate?: string; endDate?: string; limit?: number; offset?: number } = {}
) {
  let query = supabase.from("ft_deposits").select("*", { count: "exact" });

  if (options.startDate) query = query.gte("date", options.startDate);
  if (options.endDate) query = query.lte("date", options.endDate);

  query = query.order("date", { ascending: false });

  if (options.limit) query = query.limit(options.limit);
  if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

  return query;
}

export async function insertDeposit(supabase: Client, deposit: DepositInsert) {
  return supabase.from("ft_deposits").insert(deposit).select().single();
}

export async function deleteDeposit(supabase: Client, id: string) {
  return supabase.from("ft_deposits").delete().eq("id", id);
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export async function getCards(supabase: Client) {
  return supabase.from("ft_cards").select("*").order("bank");
}

export async function insertCard(supabase: Client, card: CardInsert) {
  return supabase.from("ft_cards").insert(card).select().single();
}

export async function updateCard(supabase: Client, id: string, updates: CardUpdate) {
  return supabase.from("ft_cards").update(updates).eq("id", id).select().single();
}

export async function deleteCard(supabase: Client, id: string) {
  return supabase.from("ft_cards").delete().eq("id", id);
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function getSubscriptions(supabase: Client) {
  return supabase.from("ft_subscriptions").select("*").order("is_active", { ascending: false }).order("title");
}

export async function insertSubscription(supabase: Client, sub: SubscriptionInsert) {
  return supabase.from("ft_subscriptions").insert(sub).select().single();
}

export async function updateSubscription(supabase: Client, id: string, updates: SubscriptionUpdate) {
  return supabase.from("ft_subscriptions").update(updates).eq("id", id).select().single();
}

export async function deleteSubscription(supabase: Client, id: string) {
  return supabase.from("ft_subscriptions").delete().eq("id", id);
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function getBudgets(supabase: Client) {
  return supabase.from("ft_budgets").select("*").order("amount", { ascending: false });
}

export async function insertBudget(supabase: Client, budget: BudgetInsert) {
  return supabase.from("ft_budgets").insert(budget).select().single();
}

export async function updateBudget(supabase: Client, id: string, updates: BudgetUpdate) {
  return supabase.from("ft_budgets").update(updates).eq("id", id).select().single();
}

export async function deleteBudget(supabase: Client, id: string) {
  return supabase.from("ft_budgets").delete().eq("id", id);
}

// ─── Income Sources ───────────────────────────────────────────────────────────

export async function getIncomeSources(supabase: Client) {
  return supabase.from("ft_income_sources").select("*").order("source_name");
}

export async function insertIncomeSource(supabase: Client, source: IncomeSourceInsert) {
  return supabase.from("ft_income_sources").insert(source).select().single();
}

export async function updateIncomeSource(supabase: Client, id: string, updates: IncomeSourceUpdate) {
  return supabase.from("ft_income_sources").update(updates).eq("id", id).select().single();
}

export async function deleteIncomeSource(supabase: Client, id: string) {
  return supabase.from("ft_income_sources").delete().eq("id", id);
}

// ─── Income Records ───────────────────────────────────────────────────────────

export async function getIncomeRecords(
  supabase: Client,
  options: { startDate?: string; endDate?: string } = {}
) {
  let query = supabase.from("ft_income_records").select("*");

  if (options.startDate) query = query.gte("date", options.startDate);
  if (options.endDate) query = query.lte("date", options.endDate);

  return query.order("date", { ascending: false });
}

export async function insertIncomeRecord(supabase: Client, record: IncomeRecordInsert) {
  return supabase.from("ft_income_records").insert(record).select().single();
}

export async function deleteIncomeRecord(supabase: Client, id: string) {
  return supabase.from("ft_income_records").delete().eq("id", id);
}
