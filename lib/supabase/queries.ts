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
  IncomeRecordUpdate,
  CategoryInsert,
  CategoryUpdate,
  SubcategoryInsert,
  SubcategoryUpdate,
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

// ─── Hidden Categories ───────────────────────────────────────────────────────

export async function getUserHiddenCategories(supabase: Client, userId: string) {
  return supabase
    .from("ft_user_hidden_categories")
    .select("category_id")
    .eq("user_id", userId);
}

export async function hideCategory(supabase: Client, userId: string, categoryId: string) {
  return supabase
    .from("ft_user_hidden_categories")
    .insert({ user_id: userId, category_id: categoryId });
}

export async function unhideCategory(supabase: Client, userId: string, categoryId: string) {
  return supabase
    .from("ft_user_hidden_categories")
    .delete()
    .eq("user_id", userId)
    .eq("category_id", categoryId);
}

// ─── Category CRUD ───────────────────────────────────────────────────────────

export async function insertCategory(supabase: Client, data: CategoryInsert) {
  return supabase.from("ft_categories").insert(data).select().single();
}

export async function updateCategory(supabase: Client, id: string, data: CategoryUpdate) {
  return supabase.from("ft_categories").update(data).eq("id", id).select().single();
}

export async function deleteCategory(supabase: Client, id: string) {
  return supabase.from("ft_categories").delete().eq("id", id);
}

// ─── Subcategory CRUD ────────────────────────────────────────────────────────

export async function insertSubcategory(supabase: Client, data: SubcategoryInsert) {
  return supabase.from("ft_subcategories").insert(data).select().single();
}

export async function updateSubcategory(supabase: Client, id: string, data: SubcategoryUpdate) {
  return supabase.from("ft_subcategories").update(data).eq("id", id).select().single();
}

export async function deleteSubcategory(supabase: Client, id: string) {
  return supabase.from("ft_subcategories").delete().eq("id", id);
}

export async function deleteSubcategoriesByIds(supabase: Client, ids: string[]) {
  return supabase.from("ft_subcategories").delete().in("id", ids);
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

export async function getExpenseCountByCategory(supabase: Client, categoryId: string) {
  return supabase
    .from("ft_expenses")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);
}

export async function getExpensesBySubcategoryId(supabase: Client, subcategoryId: string) {
  return supabase
    .from("ft_expenses")
    .select("*")
    .eq("subcategory_id", subcategoryId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function getExpenseCountsBySubcategoryIds(supabase: Client, subcategoryIds: string[]) {
  return supabase
    .from("ft_expenses")
    .select("subcategory_id")
    .in("subcategory_id", subcategoryIds);
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

// ─── Juanes Tab (Ivonne cross-account) ────────────────────────────────────────

export async function getIvonneDeposits(supabase: Client) {
  return supabase.rpc("get_ivonne_deposits");
}

export async function getIvonneExpenses(supabase: Client) {
  return supabase.rpc("get_ivonne_expenses");
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

export async function getActiveSubscriptions(supabase: Client) {
  return supabase.from("ft_subscriptions").select("*").eq("is_active", true);
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
  options: { startDate?: string; endDate?: string; limit?: number; offset?: number } = {}
) {
  let query = supabase.from("ft_income_records").select("*", { count: "exact" });

  if (options.startDate) query = query.gte("date", options.startDate);
  if (options.endDate) query = query.lte("date", options.endDate);

  query = query.order("date", { ascending: false });

  if (options.limit) query = query.limit(options.limit);
  if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

  return query;
}

export async function getIncomeRecordById(supabase: Client, id: string) {
  return supabase.from("ft_income_records").select("*").eq("id", id).single();
}

export async function insertIncomeRecord(supabase: Client, record: IncomeRecordInsert) {
  return supabase.from("ft_income_records").insert(record).select().single();
}

export async function updateIncomeRecord(supabase: Client, id: string, updates: IncomeRecordUpdate) {
  return supabase.from("ft_income_records").update(updates).eq("id", id).select().single();
}

export async function deleteIncomeRecord(supabase: Client, id: string) {
  return supabase.from("ft_income_records").delete().eq("id", id);
}

// ─── Aggregates & Helpers ────────────────────────────────────────────────────

export async function getOldestExpenseDate(supabase: Client) {
  return supabase.from("ft_expenses").select("date").order("date", { ascending: true }).limit(1);
}

export async function getNewestExpenseDate(supabase: Client) {
  return supabase.from("ft_expenses").select("date").order("date", { ascending: false }).limit(1);
}

export async function getOldestIncomeDate(supabase: Client) {
  return supabase.from("ft_income_records").select("date").order("date", { ascending: true }).limit(1);
}

export async function getNewestIncomeDate(supabase: Client) {
  return supabase.from("ft_income_records").select("date").order("date", { ascending: false }).limit(1);
}

export async function getVisibleCategoriesWithSubs(supabase: Client, userId: string) {
  const [catsRes, subsRes, hiddenRes] = await Promise.all([
    supabase.from("ft_categories").select("*").order("display_order"),
    supabase.from("ft_subcategories").select("*").order("display_order"),
    supabase.from("ft_user_hidden_categories").select("category_id").eq("user_id", userId),
  ]);

  return { categories: catsRes, subcategories: subsRes, hiddenCategories: hiddenRes };
}
