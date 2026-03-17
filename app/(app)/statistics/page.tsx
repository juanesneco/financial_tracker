"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getMonthDateRange, formatMonthYear } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import type { Expense, Category, CategoryTotal } from "@/lib/types";

const CHART_COLORS = [
  "#0d4ea6", "#D4915E", "#E57373", "#64B5F6", "#81C784",
  "#BA68C8", "#FFB74D", "#4DB6AC", "#7986CB", "#A1887F",
  "#F06292", "#4FC3F7", "#90A4AE",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthlyData {
  month: number;
  income: number;
  expenses: number;
}

export default function StatisticsPage() {
  const supabase = createClient();
  const now = new Date();

  // View state
  const [view, setView] = useState<"year" | "month">("year");
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  // Year view data
  const [yearLoading, setYearLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  // Valid year range (based on actual data)
  const [minYear, setMinYear] = useState(now.getFullYear());
  const [maxYear, setMaxYear] = useState(now.getFullYear());

  // Month detail data
  const [monthLoading, setMonthLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [trendData, setTrendData] = useState<{ month: string; total: number }[]>([]);

  // ─── Fetch valid year range on mount ─────────────────────────────────────────
  useEffect(() => {
    async function fetchYearRange() {
      const [{ data: oldestExp }, { data: oldestInc }, { data: newestExp }, { data: newestInc }] = await Promise.all([
        supabase.from("ft_expenses").select("date").order("date", { ascending: true }).limit(1),
        supabase.from("ft_income_records").select("date").order("date", { ascending: true }).limit(1),
        supabase.from("ft_expenses").select("date").order("date", { ascending: false }).limit(1),
        supabase.from("ft_income_records").select("date").order("date", { ascending: false }).limit(1),
      ]);

      const dates = [
        oldestExp?.[0]?.date, oldestInc?.[0]?.date,
        newestExp?.[0]?.date, newestInc?.[0]?.date,
      ].filter(Boolean).map((d: string) => new Date(d + "T00:00:00").getFullYear());

      if (dates.length > 0) {
        setMinYear(Math.min(...dates));
        setMaxYear(Math.max(...dates));
      }
    }
    fetchYearRange();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Year view fetch ────────────────────────────────────────────────────────
  const fetchYearData = useCallback(async () => {
    setYearLoading(true);
    try {
      const promises = Array.from({ length: 12 }, async (_, m) => {
        const { start, end } = getMonthDateRange(m, selectedYear);

        const [{ data: expData }, { data: incData }] = await Promise.all([
          supabase.from("ft_expenses").select("amount").gte("date", start).lte("date", end),
          supabase.from("ft_income_records").select("amount").gte("date", start).lte("date", end),
        ]);

        const expenses = (expData || []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);
        const income = (incData || []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);

        return { month: m, income, expenses };
      });

      setMonthlyData(await Promise.all(promises));
    } finally {
      setYearLoading(false);
    }
  }, [supabase, selectedYear]);

  // ─── Month detail fetch ─────────────────────────────────────────────────────
  const fetchMonthData = useCallback(async () => {
    setMonthLoading(true);
    try {
      const { data: cats } = await supabase
        .from("ft_categories")
        .select("*")
        .order("display_order");
      setCategories((cats || []) as Category[]);

      const { start, end } = getMonthDateRange(selectedMonth, selectedYear);
      const { data: exps } = await supabase
        .from("ft_expenses")
        .select("*")
        .gte("date", start)
        .lte("date", end);

      const expenseList = (exps || []) as Expense[];
      setExpenses(expenseList);

      // Category totals
      const catMap = new Map<string, { total: number; count: number }>();
      expenseList.forEach((e) => {
        const existing = catMap.get(e.category_id) || { total: 0, count: 0 };
        catMap.set(e.category_id, { total: existing.total + Number(e.amount), count: existing.count + 1 });
      });

      const totals: CategoryTotal[] = [];
      catMap.forEach(({ total, count }, catId) => {
        const cat = (cats || []).find((c: Category) => c.id === catId);
        if (cat) totals.push({ category: cat, total, count });
      });
      totals.sort((a, b) => b.total - a.total);
      setCategoryTotals(totals);

      // 6-month trend
      const months = [];
      for (let i = 5; i >= 0; i--) {
        let m = selectedMonth - i;
        let y = selectedYear;
        while (m < 0) { m += 12; y--; }
        months.push({ month: m, year: y });
      }

      const trendPromises = months.map(async ({ month, year }) => {
        const { start: s, end: e } = getMonthDateRange(month, year);
        const { data } = await supabase
          .from("ft_expenses")
          .select("amount")
          .gte("date", s)
          .lte("date", e);

        const total = (data || []).reduce((sum: number, row: { amount: number }) => sum + Number(row.amount), 0);
        const monthName = new Date(year, month).toLocaleDateString("en", { month: "short" });
        return { month: monthName, total };
      });

      setTrendData(await Promise.all(trendPromises));
    } finally {
      setMonthLoading(false);
    }
  }, [supabase, selectedMonth, selectedYear]);

  // Fetch on view/year/month changes
  useEffect(() => {
    if (view === "year") fetchYearData();
  }, [view, fetchYearData]);

  useEffect(() => {
    if (view === "month") fetchMonthData();
  }, [view, fetchMonthData]);

  // ─── Derived data ───────────────────────────────────────────────────────────
  const yearTotalIncome = monthlyData.reduce((s, d) => s + d.income, 0);
  const yearTotalExpenses = monthlyData.reduce((s, d) => s + d.expenses, 0);
  const yearNet = yearTotalIncome - yearTotalExpenses;

  const monthTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const pieData = categoryTotals.map((ct, i) => ({
    name: ct.category.name,
    value: ct.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const barChartData = monthlyData.map((d) => ({
    name: MONTH_SHORT[d.month],
    Income: d.income,
    Expenses: d.expenses,
  }));

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleMonthClick = (month: number) => {
    setSelectedMonth(month);
    setView("month");
  };

  const handleBackToYear = () => {
    setView("year");
  };

  // ─── Year View ──────────────────────────────────────────────────────────────
  if (view === "year") {
    if (yearLoading) {
      return (
        <>
          <Header title="Statistics" />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </>
      );
    }

    return (
      <>
        <Header title="Statistics" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl lg:max-w-full mx-auto p-4 md:p-6 space-y-6 md:space-y-10">
            {/* Year selector */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                disabled={selectedYear <= minYear}
                className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-serif font-semibold tabular-nums">{selectedYear}</h2>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                disabled={selectedYear >= maxYear}
                className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Yearly summary */}
            <Card className="min-w-0 overflow-hidden">
              <CardContent className="pt-6 min-w-0">
                <div className="grid grid-cols-3 gap-4 min-w-0 text-center">
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-muted-foreground mb-1">Income</p>
                    <div className="min-w-0 w-full overflow-hidden">
                      <p className="currency-display text-xs sm:text-sm md:text-lg font-semibold text-emerald-600">{formatCurrency(yearTotalIncome)}</p>
                    </div>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-muted-foreground mb-1">Expenses</p>
                    <div className="min-w-0 w-full overflow-hidden">
                      <p className="currency-display text-xs sm:text-sm md:text-lg font-semibold text-red-500">{formatCurrency(yearTotalExpenses)}</p>
                    </div>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs text-muted-foreground mb-1">Net</p>
                    <div className="min-w-0 w-full overflow-hidden">
                      <p className={`currency-display text-xs sm:text-sm md:text-lg font-semibold ${yearNet >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {yearNet >= 0 ? "+" : ""}{formatCurrency(yearNet)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 12-month bar chart */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Income vs Expenses</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="Income" fill="#059669" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly table */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Monthly Breakdown</h3>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.map((d) => {
                      const net = d.income - d.expenses;
                      return (
                        <TableRow
                          key={d.month}
                          className="cursor-pointer"
                          onClick={() => handleMonthClick(d.month)}
                        >
                          <TableCell className="font-medium text-xs md:text-sm">{MONTH_NAMES[d.month]}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600 text-xs md:text-sm">
                            {formatCurrency(d.income)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-red-500 text-xs md:text-sm">
                            {formatCurrency(d.expenses)}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums font-medium text-xs md:text-sm ${net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {net >= 0 ? "+" : ""}{formatCurrency(net)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold text-xs md:text-sm">Total</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-emerald-600 text-xs md:text-sm min-w-0 whitespace-nowrap">
                        {formatCurrency(yearTotalIncome)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-red-500 text-xs md:text-sm min-w-0 whitespace-nowrap">
                        {formatCurrency(yearTotalExpenses)}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums font-semibold text-xs md:text-sm min-w-0 whitespace-nowrap ${yearNet >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {yearNet >= 0 ? "+" : ""}{formatCurrency(yearNet)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  // ─── Month Detail View ──────────────────────────────────────────────────────
  if (monthLoading) {
    return (
      <>
        <Header title="Statistics" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Statistics" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl lg:max-w-full mx-auto p-4 md:p-6 space-y-6 md:space-y-10">
          {/* Back button + month label */}
          <div className="space-y-1">
            <button
              onClick={handleBackToYear}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {selectedYear}
            </button>
            <h2 className="text-xl font-serif font-semibold">{formatMonthYear(selectedMonth, selectedYear)}</h2>
          </div>

          {/* Total */}
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="pt-6 text-center min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
              <div className="min-w-0 w-full overflow-hidden">
                <p className="currency-display text-xl sm:text-2xl md:text-3xl font-serif font-semibold text-primary">{formatCurrency(monthTotal)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{expenses.length} transactions</p>
            </CardContent>
          </Card>

          {/* Category Pie Chart */}
          {pieData.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif text-lg font-semibold mb-4">By Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categoryTotals.map((ct, i) => (
                    <div key={ct.category.id} className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-xs text-muted-foreground truncate min-w-0">{ct.category.name}</span>
                      <span className="currency-display text-xs font-medium ml-auto min-w-0">{formatCurrency(ct.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Trend */}
          {trendData.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif text-lg font-semibold mb-4">6-Month Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="total" fill="#0d4ea6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Categories */}
          {categoryTotals.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Top Categories</h3>
                <div className="space-y-3">
                  {categoryTotals.slice(0, 8).map((ct) => {
                    const percentage = monthTotal > 0 ? (ct.total / monthTotal) * 100 : 0;
                    return (
                      <div key={ct.category.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm min-w-0 gap-2">
                          <span className="flex items-center gap-2 min-w-0 truncate">
                            <span className="shrink-0">{ct.category.emoji || ct.category.icon}</span>
                            <span className="font-medium truncate">{ct.category.name}</span>
                          </span>
                          <span className="currency-display shrink-0">{formatCurrency(ct.total)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {percentage.toFixed(1)}% of total &middot; {ct.count} items
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
