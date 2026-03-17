"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import type { Deposit, Expense } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthlyRow {
  month: number;
  deposits: number;
  expenses: number;
  net: number;
}

export default function JuanesPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      const [depositsRes, expensesRes] = await Promise.all([
        supabase.rpc("get_ivonne_deposits"),
        supabase.rpc("get_ivonne_expenses"),
      ]);
      setDeposits((depositsRes.data || []) as Deposit[]);
      setExpenses((expensesRes.data || []) as Expense[]);
      setIsLoading(false);
    }
    fetchData();
  }, [supabase]);

  // All-time totals
  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netBalance = totalDeposits - totalExpenses;

  // Year range from data
  const { minYear, maxYear } = useMemo(() => {
    const allDates = [
      ...deposits.map((d) => new Date(d.date + "T00:00:00").getFullYear()),
      ...expenses.map((e) => new Date(e.date + "T00:00:00").getFullYear()),
    ];
    if (allDates.length === 0) return { minYear: selectedYear, maxYear: selectedYear };
    return { minYear: Math.min(...allDates), maxYear: Math.max(...allDates) };
  }, [deposits, expenses, selectedYear]);

  // Monthly breakdown for selected year
  const monthlyData: MonthlyRow[] = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const depTotal = deposits
        .filter((d) => {
          const dt = new Date(d.date + "T00:00:00");
          return dt.getFullYear() === selectedYear && dt.getMonth() === m;
        })
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const expTotal = expenses
        .filter((e) => {
          const dt = new Date(e.date + "T00:00:00");
          return dt.getFullYear() === selectedYear && dt.getMonth() === m;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return { month: m, deposits: depTotal, expenses: expTotal, net: depTotal - expTotal };
    });
  }, [deposits, expenses, selectedYear]);

  const yearTotalDeposits = monthlyData.reduce((s, d) => s + d.deposits, 0);
  const yearTotalExpenses = monthlyData.reduce((s, d) => s + d.expenses, 0);
  const yearNet = yearTotalDeposits - yearTotalExpenses;

  // Filtered lists for selected year
  const yearDeposits = useMemo(
    () => deposits.filter((d) => new Date(d.date + "T00:00:00").getFullYear() === selectedYear),
    [deposits, selectedYear]
  );
  const yearExpenses = useMemo(
    () => expenses.filter((e) => new Date(e.date + "T00:00:00").getFullYear() === selectedYear),
    [expenses, selectedYear]
  );

  if (isLoading) {
    return (
      <>
        <Header title="Juanes" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Juanes" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl lg:max-w-full mx-auto p-4 md:p-6 space-y-6">
          {/* All-time Summary Card */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Deposits from Ivonne</p>
                <p className="text-sm font-semibold tabular-nums text-emerald-600">
                  +{formatCurrency(totalDeposits)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Expenses for Ivonne</p>
                <p className="text-sm font-semibold tabular-nums text-red-500">
                  -{formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <p className="text-sm font-medium">Net Balance</p>
                <p className={`text-lg font-serif font-semibold tabular-nums ${netBalance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}
                </p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{deposits.length} deposits</span>
                <span>{expenses.length} expenses</span>
              </div>
            </CardContent>
          </Card>

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
                  <p className="text-xs text-muted-foreground mb-1">Deposits</p>
                  <div className="min-w-0 w-full overflow-hidden">
                    <p className="currency-display text-xs sm:text-sm md:text-lg font-semibold text-emerald-600">{formatCurrency(yearTotalDeposits)}</p>
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

          {/* Monthly Breakdown Table */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-serif text-lg font-semibold mb-4">Monthly Breakdown</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Deposits</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.map((d) => (
                      <TableRow key={d.month}>
                        <TableCell className="font-medium text-xs md:text-sm">{MONTH_NAMES[d.month]}</TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-600 text-xs md:text-sm">
                          {formatCurrency(d.deposits)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-red-500 text-xs md:text-sm">
                          {formatCurrency(d.expenses)}
                        </TableCell>
                        <TableCell className={`text-right tabular-nums font-medium text-xs md:text-sm ${d.net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {d.net >= 0 ? "+" : ""}{formatCurrency(d.net)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold text-xs md:text-sm">Total</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-emerald-600 text-xs md:text-sm min-w-0 whitespace-nowrap">
                        {formatCurrency(yearTotalDeposits)}
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

          {/* Deposits List */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Deposits — {selectedYear} ({yearDeposits.length})</p>
            <Card className="py-0 gap-0 divide-y">
              {yearDeposits.map((deposit) => (
                <div key={deposit.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{deposit.title || "Deposit"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(deposit.date)}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-emerald-600">
                    +{formatCurrency(Number(deposit.amount))}
                  </p>
                </div>
              ))}
              {yearDeposits.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">No deposits in {selectedYear}</div>
              )}
            </Card>
          </div>

          {/* Expenses List */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Expenses — {selectedYear} ({yearExpenses.length})</p>
            <Card className="py-0 gap-0 divide-y">
              {yearExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-red-500">
                    -{formatCurrency(Number(expense.amount))}
                  </p>
                </div>
              ))}
              {yearExpenses.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">No expenses in {selectedYear}</div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
