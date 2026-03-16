"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, CreditCard, Banknote, Receipt, DollarSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateShort, getMonthDateRange, formatMonthYear } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddSlideOver } from "@/components/shared/AddSlideOver";
import { useResponsiveAdd } from "@/hooks/useResponsiveAdd";
import type { Expense, Category, Deposit, IncomeRecord, CategoryTotal } from "@/lib/types";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const { isDesktop } = useResponsiveAdd();
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [depositsTotal, setDepositsTotal] = useState(0);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);

  // Slide-over state
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverTab, setSlideOverTab] = useState<"expense" | "income">("expense");

  // Month/year selector
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("ft_profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      setDisplayName(
        profile?.display_name ||
        user.email?.split("@")[0] || "there"
      );

      const { data: cats } = await supabase
        .from("ft_categories")
        .select("*")
        .order("display_order");

      setCategories(cats || []);

      const { start, end } = getMonthDateRange(selectedMonth, selectedYear);

      const { data: monthExpenses } = await supabase
        .from("ft_expenses")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      const exps = (monthExpenses || []) as Expense[];
      setExpenses(exps);

      const { data: monthDeposits } = await supabase
        .from("ft_deposits")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      const deps = (monthDeposits || []) as Deposit[];
      setDeposits(deps);

      const { data: monthIncome } = await supabase
        .from("ft_income_records")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      const incRecs = (monthIncome || []) as IncomeRecord[];
      setIncomeRecords(incRecs);

      const expTotal = exps.reduce((sum, e) => sum + Number(e.amount), 0);
      setMonthlyTotal(expTotal);

      const depTotal = deps.reduce((sum, d) => sum + Number(d.amount), 0);
      setDepositsTotal(depTotal);

      const incTotal = incRecs.reduce((sum, r) => sum + Number(r.amount), 0);
      setIncomeTotal(incTotal);

      const catMap = new Map<string, { total: number; count: number }>();
      exps.forEach((e) => {
        const existing = catMap.get(e.category_id) || { total: 0, count: 0 };
        catMap.set(e.category_id, { total: existing.total + Number(e.amount), count: existing.count + 1 });
      });

      const catTotals: CategoryTotal[] = [];
      catMap.forEach(({ total, count }, catId) => {
        const cat = (cats || []).find((c: Category) => c.id === catId);
        if (cat) catTotals.push({ category: cat, total, count });
      });
      catTotals.sort((a, b) => b.total - a.total);
      setCategoryTotals(catTotals);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isLoading]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleAddClick = (tab: "expense" | "income") => {
    if (isDesktop) {
      setSlideOverTab(tab);
      setSlideOverOpen(true);
    } else {
      router.push(tab === "expense" ? "/add" : "/add-income");
    }
  };

  const expensesByDate = expenses.reduce((groups: Record<string, Expense[]>, expense) => {
    const date = expense.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
    return groups;
  }, {});

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  if (isLoading) {
    return (
      <>
        <Header title="Home" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Home" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl lg:max-w-5xl mx-auto p-4 md:p-6 space-y-6 md:space-y-10">
          {/* Greeting */}
          <div>
            <h2 className="font-serif text-2xl md:text-3xl">
              {getGreeting()}, {displayName}
            </h2>
          </div>

          {/* Quick Actions — desktop only (mobile uses bottom nav + button) */}
          <div className="fade-in hidden lg:grid grid-cols-2 gap-3">
            <button onClick={() => handleAddClick("expense")} className="block text-left">
              <Card className="hover:bg-muted/50 transition-colors transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer">
                <CardContent className="pt-5 pb-4 flex flex-col items-center gap-2">
                  <div className="h-11 w-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Receipt size={20} className="text-red-500" />
                  </div>
                  <p className="text-xs font-medium text-center">Add Expense</p>
                </CardContent>
              </Card>
            </button>
            <button onClick={() => handleAddClick("income")} className="block text-left">
              <Card className="hover:bg-muted/50 transition-colors transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer">
                <CardContent className="pt-5 pb-4 flex flex-col items-center gap-2">
                  <div className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <DollarSign size={20} className="text-emerald-600" />
                  </div>
                  <p className="text-xs font-medium text-center">Add Income</p>
                </CardContent>
              </Card>
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>&larr;</Button>
            <p className="text-sm font-medium">{formatMonthYear(selectedMonth, selectedYear)}</p>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>&rarr;</Button>
          </div>

          {/* Summary Cards */}
          <div className="fade-in fade-in-delay-1 grid grid-cols-3 gap-3 min-w-0">
            <Card className="min-w-0 overflow-hidden">
              <CardContent className="pt-5 pb-4 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Income</p>
                <div className="min-w-0 w-full overflow-hidden">
                  <p className="currency-display text-xs sm:text-sm md:text-lg font-serif font-semibold text-emerald-600">
                    {formatCurrency(incomeTotal)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-0 overflow-hidden">
              <CardContent className="pt-5 pb-4 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Expenses</p>
                <div className="min-w-0 w-full overflow-hidden">
                  <p className="currency-display text-xs sm:text-sm md:text-lg font-serif font-semibold text-red-500">
                    {formatCurrency(monthlyTotal)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className={`min-w-0 overflow-hidden ${incomeTotal - monthlyTotal >= 0 ? "border-emerald-200 dark:border-emerald-800" : "border-red-200 dark:border-red-800"}`}>
              <CardContent className="pt-5 pb-4 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Net</p>
                <div className="min-w-0 w-full overflow-hidden">
                  <p className={`currency-display text-xs sm:text-sm md:text-lg font-serif font-semibold ${incomeTotal - monthlyTotal >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {incomeTotal - monthlyTotal >= 0 ? "+" : ""}{formatCurrency(incomeTotal - monthlyTotal)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop two-column layout for category breakdown + recent expenses */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
            {/* Category Breakdown */}
            {categoryTotals.length > 0 && (
              <div className="fade-in fade-in-delay-2">
                <h3 className="text-[0.8rem] uppercase tracking-[0.25em] font-semibold mb-3 text-primary font-sans">By category</h3>
                <div className="grid grid-cols-2 gap-3 min-w-0">
                  {categoryTotals.slice(0, 6).map(({ category, total, count }) => (
                    <Card key={category.id} className="py-3 min-w-0 overflow-hidden">
                      <CardContent className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{category.emoji || category.icon}</span>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-xs text-muted-foreground line-clamp-2 break-words">{category.name}</p>
                          <div className="min-w-0 w-full overflow-hidden">
                            <p className="currency-display font-semibold text-sm">{formatCurrency(total)}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{count} items</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Expenses */}
            <div className="fade-in fade-in-delay-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[0.8rem] uppercase tracking-[0.25em] font-semibold text-primary font-sans">Recent Expenses</h3>
                <Button variant="ghost" size="sm" onClick={() => handleAddClick("expense")} className="hidden lg:inline-flex gap-1">
                  <Plus size={16} /> Add
                </Button>
              </div>

              {expenses.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">No expenses this month yet</p>
                    <Button onClick={() => handleAddClick("expense")}>
                      Add your first expense
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Object.entries(expensesByDate).slice(0, 7).map(([date, dateExpenses]) => (
                    <div key={date}>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                        {formatDateShort(date)}
                      </p>
                      <Card className="py-0 gap-0 divide-y">
                        {dateExpenses.map((expense) => {
                          const cat = getCategoryById(expense.category_id);
                          return (
                            <Link
                              key={expense.id}
                              href={`/expenses/${expense.id}?from=home`}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                            >
                              <span className="text-lg">{cat?.emoji || cat?.icon || "📦"}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {expense.title || expense.note || cat?.name || "Expense"}
                                </p>
                                <p className="text-xs text-muted-foreground">{cat?.name}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {expense.payment_method === "card" && <CreditCard size={12} className="text-muted-foreground" />}
                                {expense.payment_method === "cash" && <Banknote size={12} className="text-muted-foreground" />}
                                <p className="text-sm font-semibold tabular-nums">
                                  {formatCurrency(Number(expense.amount))}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </Card>
                    </div>
                  ))}
                  {Object.keys(expensesByDate).length > 7 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/balance">View all expenses</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Desktop slide-over */}
      <AddSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        defaultTab={slideOverTab}
        onSuccess={fetchData}
      />
    </>
  );
}
