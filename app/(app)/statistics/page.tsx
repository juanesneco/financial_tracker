"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getMonthDateRange } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { MonthYearPicker } from "@/components/shared/MonthYearPicker";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import type { Expense, Category, CategoryTotal } from "@/lib/types";

const CHART_COLORS = [
  "#4A7C6F", "#D4915E", "#E57373", "#64B5F6", "#81C784",
  "#BA68C8", "#FFB74D", "#4DB6AC", "#7986CB", "#A1887F",
  "#F06292", "#4FC3F7", "#90A4AE",
];

export default function StatisticsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Monthly trend data (last 6 months)
  const [trendData, setTrendData] = useState<{ month: string; total: number }[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const { data: cats } = await supabase
        .from("ft_categories")
        .select("*")
        .order("display_order");
      setCategories((cats || []) as Category[]);

      // Fetch current month expenses
      const { start, end } = getMonthDateRange(selectedMonth, selectedYear);
      const { data: exps } = await supabase
        .from("ft_expenses")
        .select("*")
        .gte("date", start)
        .lte("date", end);

      const expenseList = (exps || []) as Expense[];
      setExpenses(expenseList);

      // Calculate category totals
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

      // Calculate 6-month trend
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
      setIsLoading(false);
    }
  }, [supabase, selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Pie chart data
  const pieData = categoryTotals.map((ct, i) => ({
    name: ct.category.name,
    value: ct.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  if (isLoading) {
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
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
          <MonthYearPicker
            month={selectedMonth}
            year={selectedYear}
            onChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
          />

          {/* Total */}
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-3xl font-serif font-semibold text-primary">{formatCurrency(monthTotal)}</p>
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
                    <div key={ct.category.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-xs text-muted-foreground truncate">{ct.category.name}</span>
                      <span className="text-xs font-medium ml-auto">{formatCurrency(ct.total)}</span>
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
                    <Bar dataKey="total" fill="#4A7C6F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Subcategories */}
          {categoryTotals.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Top Categories</h3>
                <div className="space-y-3">
                  {categoryTotals.slice(0, 8).map((ct) => {
                    const percentage = monthTotal > 0 ? (ct.total / monthTotal) * 100 : 0;
                    return (
                      <div key={ct.category.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span>{ct.category.emoji || ct.category.icon}</span>
                            <span className="font-medium">{ct.category.name}</span>
                          </span>
                          <span className="tabular-nums">{formatCurrency(ct.total)}</span>
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
