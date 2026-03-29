"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Search, CreditCard, Banknote } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getExpenses } from "@/lib/supabase/queries";
import { formatCurrency, formatDateShort } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Expense } from "@/lib/types";
import { useCategories } from "@/hooks/useCategories";

const PAGE_SIZE = 50;

export default function ExpensesPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { categories, visibleCategories } = useCategories();
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 300);
  };

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, count } = await getExpenses(supabase, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        categoryId: categoryFilter || undefined,
        paymentMethod: paymentFilter || undefined,
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });

      setExpenses((data || []) as Expense[]);
      setTotalCount(count || 0);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, page, debouncedSearch, categoryFilter, paymentFilter, startDate, endDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Group expenses by date
  const expensesByDate = expenses.reduce((groups: Record<string, Expense[]>, expense) => {
    const date = expense.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
    return groups;
  }, {});

  return (
    <>
      <Header title="Expenses" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl lg:max-w-full mx-auto p-4 md:p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setPage(0); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {visibleCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.emoji || cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v === "all" ? "" : v); setPage(0); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              className="w-[140px]"
              placeholder="From"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              className="w-[140px]"
              placeholder="To"
            />
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            {totalCount} expense{totalCount !== 1 ? "s" : ""} found
          </p>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length === 0 ? (
            <Card className="py-8 text-center">
              <p className="text-muted-foreground">No expenses found</p>
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
                        <Link
                          key={expense.id}
                          href={`/expenses/${expense.id}?from=expenses`}
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
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
