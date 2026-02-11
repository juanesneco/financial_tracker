"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, CreditCard, Banknote } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateShort, getMonthDateRange, formatMonthYear } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Expense, Category, Deposit, CategoryTotal } from "@/lib/types";

export default function DashboardPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [depositsTotal, setDepositsTotal] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);

  // Month/year selector
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from("ft_profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      setDisplayName(
        profile?.display_name ||
        user.email?.split("@")[0] || "there"
      );

      // Fetch categories
      const { data: cats } = await supabase
        .from("ft_categories")
        .select("*")
        .order("display_order");

      setCategories(cats || []);

      // Date range for selected month
      const { start, end } = getMonthDateRange(selectedMonth, selectedYear);

      // Fetch expenses for month
      const { data: monthExpenses } = await supabase
        .from("ft_expenses")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      const exps = (monthExpenses || []) as Expense[];
      setExpenses(exps);

      // Fetch deposits for month
      const { data: monthDeposits } = await supabase
        .from("ft_deposits")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      const deps = (monthDeposits || []) as Deposit[];
      setDeposits(deps);

      // Calculate totals
      const expTotal = exps.reduce((sum, e) => sum + Number(e.amount), 0);
      setMonthlyTotal(expTotal);

      const depTotal = deps.reduce((sum, d) => sum + Number(d.amount), 0);
      setDepositsTotal(depTotal);

      // Category totals
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

  // Group expenses by date
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
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
          {/* Greeting */}
          <div>
            <h2 className="font-serif text-2xl md:text-3xl">
              {getGreeting()}, {displayName}
            </h2>
          </div>

          {/* Month Selector */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>&larr;</Button>
            <p className="text-sm font-medium">{formatMonthYear(selectedMonth, selectedYear)}</p>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>&rarr;</Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Expenses</p>
                <p className="text-2xl md:text-3xl font-serif font-semibold text-primary">
                  {formatCurrency(monthlyTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
            {deposits.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Deposits</p>
                  <p className="text-2xl md:text-3xl font-serif font-semibold text-accent-foreground">
                    {formatCurrency(depositsTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {deposits.length} deposit{deposits.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Category Breakdown */}
          {categoryTotals.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold mb-3">By Category</h3>
              <div className="grid grid-cols-2 gap-3">
                {categoryTotals.slice(0, 6).map(({ category, total, count }) => (
                  <Card key={category.id} className="py-3">
                    <CardContent className="flex items-center gap-3">
                      <span className="text-xl">{category.emoji || category.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">{category.name}</p>
                        <p className="font-semibold text-sm">{formatCurrency(total)}</p>
                        <p className="text-[10px] text-muted-foreground">{count} items</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Expenses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg font-semibold">Recent Expenses</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/add" className="gap-1">
                  <Plus size={16} /> Add
                </Link>
              </Button>
            </div>

            {expenses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">No expenses this month yet</p>
                  <Button asChild>
                    <Link href="/add">Add your first expense</Link>
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
                            href={`/expenses/${expense.id}`}
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
                    <Link href="/expenses">View all expenses</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
