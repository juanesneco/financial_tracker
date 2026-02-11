"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
import type { Budget, Category, Expense } from "@/lib/types";

export default function BudgetsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");

  const fetchData = useCallback(async () => {
    const now = new Date();
    const { start, end } = getMonthDateRange(now.getMonth(), now.getFullYear());

    const [
      { data: b },
      { data: cats },
      { data: exps },
    ] = await Promise.all([
      supabase.from("ft_budgets").select("*").order("amount", { ascending: false }),
      supabase.from("ft_categories").select("*").order("display_order"),
      supabase.from("ft_expenses").select("*").gte("date", start).lte("date", end),
    ]);

    setBudgets((b || []) as Budget[]);
    setCategories((cats || []) as Category[]);
    setExpenses((exps || []) as Expense[]);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const getSpentForCategory = (catId: string) => {
    return expenses
      .filter(e => e.category_id === catId)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const handleAdd = async () => {
    if (!categoryId || !amount) { toast.error("Category and amount required"); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("ft_budgets").insert({
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
    const { error } = await supabase.from("ft_budgets").delete().eq("id", id);
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
        <div className="max-w-lg mx-auto p-4 md:p-6 space-y-4">
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
                      {categories.map((cat) => (
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
              const cat = budget.category_id ? getCategoryById(budget.category_id) : null;
              const spent = budget.category_id ? getSpentForCategory(budget.category_id) : 0;
              const budgetAmount = Number(budget.amount);
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

                    {/* Progress bar */}
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
