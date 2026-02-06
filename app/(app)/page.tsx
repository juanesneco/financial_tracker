"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateShort } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Expense {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CategoryTotal {
  category: Category;
  total: number;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from("ft_profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        setDisplayName(
          profile?.display_name ||
          user.email?.split("@")[0] || "there"
        );

        // Fetch categories
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: cats } = await (supabase as any)
          .from("ft_categories")
          .select("*")
          .order("display_order");

        setCategories(cats || []);

        // Fetch current month expenses
        const now = new Date();
        const startOfMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
        const endOfMonth = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: monthExpenses } = await (supabase as any)
          .from("ft_expenses")
          .select("*")
          .gte("date", startOfMonth)
          .lte("date", endOfMonth)
          .order("date", { ascending: false });

        const exps = monthExpenses || [];
        setExpenses(exps);

        // Calculate monthly total
        const total = exps.reduce((sum: number, e: Expense) => sum + Number(e.amount), 0);
        setMonthlyTotal(total);

        // Calculate category totals
        const catMap = new Map<string, number>();
        exps.forEach((e: Expense) => {
          catMap.set(e.category_id, (catMap.get(e.category_id) || 0) + Number(e.amount));
        });

        const catTotals: CategoryTotal[] = [];
        catMap.forEach((total, catId) => {
          const cat = (cats || []).find((c: Category) => c.id === catId);
          if (cat) {
            catTotals.push({ category: cat, total });
          }
        });
        catTotals.sort((a, b) => b.total - a.total);
        setCategoryTotals(catTotals);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const currentMonth = format(new Date(), "MMMM yyyy");

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
            <p className="text-muted-foreground text-sm mt-1">{currentMonth}</p>
          </div>

          {/* Monthly Total Card */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">This month</p>
              <p className="text-3xl md:text-4xl font-serif font-semibold text-primary">
                {formatCurrency(monthlyTotal)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          {categoryTotals.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold mb-3">By Category</h3>
              <div className="grid grid-cols-2 gap-3">
                {categoryTotals.slice(0, 6).map(({ category, total }) => (
                  <Card key={category.id} className="py-3">
                    <CardContent className="flex items-center gap-3">
                      <span className="text-xl">{category.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">{category.name}</p>
                        <p className="font-semibold text-sm">{formatCurrency(total)}</p>
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
                {Object.entries(expensesByDate).map(([date, dateExpenses]) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      {formatDateShort(date)}
                    </p>
                    <Card className="py-0 gap-0 divide-y">
                      {dateExpenses.map((expense) => {
                        const cat = getCategoryById(expense.category_id);
                        return (
                          <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
                            <span className="text-lg">{cat?.icon || "📦"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {expense.note || cat?.name || "Expense"}
                              </p>
                              <p className="text-xs text-muted-foreground">{cat?.name}</p>
                            </div>
                            <p className="text-sm font-semibold tabular-nums">
                              {formatCurrency(Number(expense.amount))}
                            </p>
                          </div>
                        );
                      })}
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
