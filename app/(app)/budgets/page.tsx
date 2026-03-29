"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getBudgets, insertBudget, deleteBudget, getExpenses } from "@/lib/supabase/queries";
import { formatCurrency, getMonthDateRange } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useCategories";
import type { Budget } from "@/lib/types";

export default function BudgetsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { categories, visibleCategories } = useCategories();
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");

  const fetchData = useCallback(async () => {
    const now = new Date();
    const { start, end } = getMonthDateRange(now.getMonth(), now.getFullYear());

    try {
      const [
        { data: b },
        { data: exps },
      ] = await Promise.all([
        getBudgets(supabase),
        getExpenses(supabase, { startDate: start, endDate: end }),
      ]);

      setBudgets((b ?? []) as Budget[]);
      const totals: Record<string, number> = {};
      for (const { category_id, amount: expAmount } of (exps ?? []) as Array<{ category_id: string; amount: number }>) {
        totals[category_id] = (totals[category_id] ?? 0) + expAmount;
      }
      setSpentByCategory(totals);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!categoryId || !amount) { toast.error("Category and amount required"); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await insertBudget(supabase, {
        user_id: user.id, category_id: categoryId, amount: parseFloat(amount),
      });

      if (error) { toast.error("Failed to add budget"); return; }
      toast.success("Budget added");
      setShowForm(false); setCategoryId(""); setAmount("");
      fetchData();
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget?")) return;
    const { error } = await deleteBudget(supabase, id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    fetchData();
  };

  if (isLoading) {
    return (
      <>
        <Header title="Budgets" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Budgets" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg lg:max-w-full mx-auto p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{budgets.length} budget{budgets.length !== 1 ? "s" : ""}</p>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus size={16} /> Add
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {visibleCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.emoji || cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget Amount *</Label>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleAdd} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {budgets.map((budget) => {
              const catId = budget.category_id;
              const cat = catId ? categories.find(c => c.id === catId) : null;
              const spent = catId ? (spentByCategory[catId] ?? 0) : 0;
              const budgetAmount = budget.amount;
              const percentage = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;
              const isOver = spent > budgetAmount;

              return (
                <Card key={budget.id}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat?.emoji || cat?.icon || "📦"}</span>
                        <p className="text-sm font-medium">{cat?.name || "Unknown"}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(budget.id)}>
                        <Trash2 size={14} className="text-muted-foreground" />
                      </Button>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(spent)} spent</span>
                      <span>{formatCurrency(budgetAmount)} budget</span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${isOver ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className={`text-xs font-medium ${isOver ? "text-destructive" : "text-muted-foreground"}`}>
                      {isOver
                        ? `Over budget by ${formatCurrency(spent - budgetAmount)}`
                        : `${formatCurrency(budgetAmount - spent)} remaining`}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
