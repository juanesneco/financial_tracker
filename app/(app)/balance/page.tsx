"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Search, Receipt, DollarSign, Filter, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateShort, getMonthDateRange, formatMonthYear } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddSlideOver } from "@/components/shared/AddSlideOver";
import { useResponsiveAdd } from "@/hooks/useResponsiveAdd";
import { useCategories } from "@/hooks/useCategories";
import type { Expense, Category, IncomeRecord, IncomeSource } from "@/lib/types";

const PAGE_SIZE = 50;

type BalanceEntry = {
  id: string;
  type: "income" | "expense";
  amount: number;
  title: string;
  date: string;
  category?: Category;
  source?: IncomeSource;
  paymentMethod?: string | null;
};

export default function BalancePage() {
  const supabase = createClient();
  const router = useRouter();
  const { isDesktop } = useResponsiveAdd();
  const { visibleCategories } = useCategories();
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);

  // Slide-over
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverTab, setSlideOverTab] = useState<"expense" | "income">("expense");

  // Month selector (defaults to current month)
  const [now] = useState(() => new Date());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtersActive = filtersOpen && (
    debouncedSearch !== "" || categoryFilter !== "" || paymentFilter !== "" || typeFilter !== "" || startDate !== "" || endDate !== ""
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  // Pagination
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // When filters are active, fetch all-time (with optional date range from filter)
      // Otherwise, use month selection
      let dateStart: string | null = null;
      let dateEnd: string | null = null;
      if (filtersActive) {
        dateStart = startDate || null;
        dateEnd = endDate || null;
      } else if (selectedMonth !== null) {
        const range = getMonthDateRange(selectedMonth, selectedYear);
        dateStart = range.start;
        dateEnd = range.end;
      }

      // Helper to fetch all rows (PostgREST caps at 1000 per request)
      const fetchAll = async <T,>(table: string, dateCol: string): Promise<T[]> => {
        const PAGE = 1000;
        let allRows: T[] = [];
        let from = 0;
        while (true) {
          let q = supabase.from(table).select("*").order("date", { ascending: false }).range(from, from + PAGE - 1);
          if (dateStart) q = q.gte(dateCol, dateStart);
          if (dateEnd) q = q.lte(dateCol, dateEnd);
          const { data } = await q;
          const rows = (data || []) as T[];
          allRows = allRows.concat(rows);
          if (rows.length < PAGE) break;
          from += PAGE;
        }
        return allRows;
      };

      const [catsRes, expenses, incomeRecords, sourcesRes] = await Promise.all([
        supabase.from("ft_categories").select("*").order("display_order"),
        fetchAll<Expense>("ft_expenses", "date"),
        fetchAll<IncomeRecord>("ft_income_records", "date"),
        supabase.from("ft_income_sources").select("*"),
      ]);

      const cats = (catsRes.data || []) as Category[];
      setCategories(cats);
      const sources = (sourcesRes.data || []) as IncomeSource[];

      let combined: BalanceEntry[] = [
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
          paymentMethod: e.payment_method,
        })),
      ];

      // Apply filters
      if (typeFilter === "income") {
        combined = combined.filter((e) => e.type === "income");
      } else if (typeFilter === "expense") {
        combined = combined.filter((e) => e.type === "expense");
      }

      if (categoryFilter) {
        combined = combined.filter((e) => e.type === "income" || e.category?.id === categoryFilter);
      }

      if (paymentFilter) {
        combined = combined.filter((e) => e.type === "income" || e.paymentMethod === paymentFilter);
      }

      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        combined = combined.filter((e) => e.title.toLowerCase().includes(q));
      }

      combined.sort((a, b) => b.date.localeCompare(a.date));

      const incTotal = combined.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
      const expTotal = combined.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
      setTotalIncome(incTotal);
      setTotalExpenses(expTotal);

      setEntries(combined);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedMonth, selectedYear, debouncedSearch, categoryFilter, paymentFilter, typeFilter, startDate, endDate, filtersActive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, categoryFilter, paymentFilter, typeFilter, startDate, endDate, selectedMonth, selectedYear]);

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
    if (selectedMonth === null) { setSelectedMonth(now.getMonth()); setSelectedYear(now.getFullYear()); return; }
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else setSelectedMonth(selectedMonth - 1);
  };

  const goToNextMonth = () => {
    if (selectedMonth === null) { setSelectedMonth(now.getMonth()); setSelectedYear(now.getFullYear()); return; }
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else setSelectedMonth(selectedMonth + 1);
  };

  const handleAddClick = (tab: "expense" | "income") => {
    if (isDesktop) {
      setSlideOverTab(tab);
      setSlideOverOpen(true);
    } else {
      router.push(tab === "expense" ? "/add" : "/add-income");
    }
  };

  const netBalance = totalIncome - totalExpenses;

  // Pagination
  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  const paginatedEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Group paginated entries by date
  const entriesByDate = paginatedEntries.reduce((groups: Record<string, BalanceEntry[]>, entry) => {
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
        <div className="max-w-2xl lg:max-w-full mx-auto p-4 md:p-6 space-y-6 md:space-y-10">
          {/* Month Selector / Filtered Results Header */}
          {!filtersActive ? (
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>&larr;</Button>
              <span className="text-sm font-medium">
                {selectedMonth !== null ? formatMonthYear(selectedMonth, selectedYear) : "All Time"}
              </span>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>&rarr;</Button>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-sm font-medium text-muted-foreground">Filtered Results</span>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 min-w-0 fade-in">
            <Card className="min-w-0 overflow-hidden">
              <CardContent className="pt-5 pb-4 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={14} className="text-emerald-600" />
                  <p className="text-xs text-muted-foreground">Income</p>
                </div>
                <div className="min-w-0 w-full overflow-hidden">
                  <p className="currency-display text-xs sm:text-sm md:text-lg font-serif font-semibold text-emerald-600">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-0 overflow-hidden">
              <CardContent className="pt-5 pb-4 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown size={14} className="text-red-500" />
                  <p className="text-xs text-muted-foreground">Expenses</p>
                </div>
                <div className="min-w-0 w-full overflow-hidden">
                  <p className="currency-display text-xs sm:text-sm md:text-lg font-serif font-semibold text-red-500">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className={`min-w-0 overflow-hidden ${netBalance >= 0 ? "border-emerald-200 dark:border-emerald-800" : "border-red-200 dark:border-red-800"}`}>
              <CardContent className="pt-5 pb-4 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Net</p>
                <div className="min-w-0 w-full overflow-hidden">
                  <p className={`currency-display text-xs sm:text-sm md:text-lg font-serif font-semibold ${netBalance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Toggle + Add Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={filtersOpen ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                const next = !filtersOpen;
                setFiltersOpen(next);
                if (!next) {
                  setSearch(""); setDebouncedSearch("");
                  setCategoryFilter(""); setPaymentFilter("");
                  setTypeFilter(""); setStartDate(""); setEndDate("");
                }
              }}
              className="gap-2"
            >
              <Filter size={14} />
              Filters
            </Button>

            {filtersActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch(""); setDebouncedSearch("");
                  setCategoryFilter(""); setPaymentFilter("");
                  setTypeFilter(""); setStartDate(""); setEndDate("");
                }}
                className="gap-1 text-muted-foreground"
              >
                <X size={14} />
                Clear Filters
              </Button>
            )}

            {/* Add buttons — desktop only */}
            <div className="hidden lg:flex items-center gap-2 ml-auto">
              <Button onClick={() => handleAddClick("expense")} variant="outline" size="sm" className="gap-2">
                <Receipt size={16} /> Add Expense
              </Button>
              <Button onClick={() => handleAddClick("income")} variant="outline" size="sm" className="gap-2">
                <DollarSign size={16} /> Add Income
              </Button>
            </div>
          </div>

          {/* Collapsible Filter Toolbar */}
          {filtersOpen && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="expense">Expenses</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
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

                <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                    <span className="text-sm text-muted-foreground shrink-0">From</span>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full sm:w-[140px] text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                    <span className="text-sm text-muted-foreground shrink-0">To</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full sm:w-[140px] text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {entries.length} transaction{entries.length !== 1 ? "s" : ""}
          </p>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            {paginatedEntries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No transactions found</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category / Source</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (entry.type === "expense") router.push(`/expenses/${entry.id}?from=balance`);
                          else router.push(`/income/${entry.id}?from=balance`);
                        }}
                      >
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateShort(entry.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.type === "income" ? (
                              <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <ArrowDownRight size={12} className="text-emerald-600" />
                              </div>
                            ) : (
                              <span className="text-sm">{entry.category?.emoji || entry.category?.icon || "📦"}</span>
                            )}
                            <span className="text-sm">
                              {entry.type === "income"
                                ? entry.source?.source_name || "Income"
                                : entry.category?.name || "Expense"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{entry.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground capitalize">
                          {entry.paymentMethod || "—"}
                        </TableCell>
                        <TableCell className={`text-right text-sm font-semibold tabular-nums ${entry.type === "income" ? "text-emerald-600" : "text-foreground"}`}>
                          {entry.type === "income" ? "+" : "-"}{formatCurrency(entry.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden">
            {paginatedEntries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No transactions found</p>
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
                          href={entry.type === "expense" ? `/expenses/${entry.id}?from=balance` : `/income/${entry.id}?from=balance`}
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
