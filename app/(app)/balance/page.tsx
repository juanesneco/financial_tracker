"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateShort, getMonthDateRange, formatMonthYear } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Expense, Category, IncomeRecord, IncomeSource } from "@/lib/types";

type BalanceEntry = {
  id: string;
  type: "income" | "expense";
  amount: number;
  title: string;
  date: string;
  category?: Category;
  source?: IncomeSource;
};

export default function BalancePage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { start, end } = getMonthDateRange(selectedMonth, selectedYear);

      const [catsRes, expensesRes, incomeRes, sourcesRes] = await Promise.all([
        supabase.from("ft_categories").select("*").order("display_order"),
        supabase.from("ft_expenses").select("*").gte("date", start).lte("date", end).order("date", { ascending: false }),
        supabase.from("ft_income_records").select("*").gte("date", start).lte("date", end).order("date", { ascending: false }),
        supabase.from("ft_income_sources").select("*"),
      ]);

      const cats = (catsRes.data || []) as Category[];
      setCategories(cats);
      const sources = (sourcesRes.data || []) as IncomeSource[];
      const expenses = (expensesRes.data || []) as Expense[];
      const incomeRecords = (incomeRes.data || []) as IncomeRecord[];

      const incTotal = incomeRecords.reduce((sum, r) => sum + Number(r.amount), 0);
      const expTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      setTotalIncome(incTotal);
      setTotalExpenses(expTotal);

      const combined: BalanceEntry[] = [
        ...incomeRecords.map((r) => ({
          id: r.id,
          type: "income" as const,
          amount: Number(r.amount),
          title: r.description || sources.find((s) => s.id === r.income_source_id)?.source_name || "Income",
          date: r.date,
          source: sources.find((s) => s.id === r.income_source_id),
        })),
        ...expenses.map((e) => ({
          id: e.id,
          type: "expense" as const,
          amount: Number(e.amount),
          title: e.title || e.note || cats.find((c) => c.id === e.category_id)?.name || "Expense",
          date: e.date,
          category: cats.find((c) => c.id === e.category_id),
        })),
      ];

      combined.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(combined);
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

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else setSelectedMonth(selectedMonth - 1);
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else setSelectedMonth(selectedMonth + 1);
  };

  const netBalance = totalIncome - totalExpenses;

  // Group entries by date
  const entriesByDate = entries.reduce((groups: Record<string, BalanceEntry[]>, entry) => {
    if (!groups[entry.date]) groups[entry.date] = [];
    groups[entry.date].push(entry);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <>
        <Header title="Balance Sheet" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Balance Sheet" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
          {/* Month Selector */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>&larr;</Button>
            <p className="text-sm font-medium">{formatMonthYear(selectedMonth, selectedYear)}</p>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>&rarr;</Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 fade-in">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={14} className="text-emerald-600" />
                  <p className="text-xs text-muted-foreground">Income</p>
                </div>
                <p className="text-lg md:text-xl font-serif font-semibold text-emerald-600">
                  {formatCurrency(totalIncome)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown size={14} className="text-red-500" />
                  <p className="text-xs text-muted-foreground">Expenses</p>
                </div>
                <p className="text-lg md:text-xl font-serif font-semibold text-red-500">
                  {formatCurrency(totalExpenses)}
                </p>
              </CardContent>
            </Card>
            <Card className={netBalance >= 0 ? "border-emerald-200 dark:border-emerald-800" : "border-red-200 dark:border-red-800"}>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Net</p>
                <p className={`text-lg md:text-xl font-serif font-semibold ${netBalance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Entries List */}
          <div>
            <h3 className="text-[0.8rem] uppercase tracking-[0.25em] font-semibold mb-3 text-primary font-sans fade-in fade-in-delay-1">Transactions</h3>
            {entries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No transactions this month</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(entriesByDate).map(([date, dateEntries]) => (
                  <div key={date} className="fade-in">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      {formatDateShort(date)}
                    </p>
                    <Card className="py-0 gap-0 divide-y">
                      {dateEntries.map((entry) => (
                        <Link
                          key={entry.id}
                          href={entry.type === "expense" ? `/expenses/${entry.id}` : "#"}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          {entry.type === "income" ? (
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <ArrowDownRight size={16} className="text-emerald-600" />
                            </div>
                          ) : (
                            <span className="text-lg w-8 text-center">
                              {entry.category?.emoji || entry.category?.icon || "📦"}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entry.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.type === "income"
                                ? entry.source?.source_name || "Income"
                                : entry.category?.name || "Expense"}
                            </p>
                          </div>
                          <p className={`text-sm font-semibold tabular-nums ${entry.type === "income" ? "text-emerald-600" : "text-foreground"}`}>
                            {entry.type === "income" ? "+" : "-"}{formatCurrency(entry.amount)}
                          </p>
                        </Link>
                      ))}
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
