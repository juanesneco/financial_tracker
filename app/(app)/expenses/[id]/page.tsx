"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Trash2, CreditCard, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Expense, Category, Subcategory, Card as CardType } from "@/lib/types";

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const expenseId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);

  // Edit form state
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [comments, setComments] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardId, setCardId] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: exp },
          { data: cats },
          { data: subs },
          { data: userCards },
        ] = await Promise.all([
          supabase.from("ft_expenses").select("*").eq("id", expenseId).single(),
          supabase.from("ft_categories").select("*").order("display_order"),
          supabase.from("ft_subcategories").select("*").order("display_order"),
          supabase.from("ft_cards").select("*").order("bank"),
        ]);

        if (!exp) {
          toast.error("Expense not found");
          router.push("/expenses");
          return;
        }

        const e = exp as Expense;
        setExpense(e);
        setCategories((cats || []) as Category[]);
        setSubcategories((subs || []) as Subcategory[]);
        setCards((userCards || []) as CardType[]);

        // Initialize form
        setAmount(String(e.amount));
        setTitle(e.title || "");
        setCategoryId(e.category_id);
        setSubcategoryId(e.subcategory_id || "");
        setDate(e.date);
        setNote(e.note || "");
        setComments(e.comments || "");
        setPaymentMethod(e.payment_method || "");
        setCardId(e.card_id || "");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase, expenseId, router]);

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getSubcategoryById = (id: string) => subcategories.find(s => s.id === id);
  const getCardById = (id: string) => cards.find(c => c.id === id);

  const filteredSubcategories = subcategories.filter(s => s.category_id === categoryId);

  const handleSave = async () => {
    if (!amount || !categoryId || !date) {
      toast.error("Please fill required fields");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ft_expenses")
        .update({
          amount: parseFloat(amount),
          title: title || null,
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          date,
          note: note || null,
          comments: comments || null,
          payment_method: paymentMethod || null,
          card_id: cardId || null,
        })
        .eq("id", expenseId);

      if (error) {
        toast.error("Failed to update expense");
        return;
      }

      toast.success("Expense updated");
      setIsEditing(false);

      // Refresh data
      const { data: updated } = await supabase.from("ft_expenses").select("*").eq("id", expenseId).single();
      if (updated) setExpense(updated as Expense);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from("ft_expenses").delete().eq("id", expenseId);
      if (error) {
        toast.error("Failed to delete expense");
        return;
      }

      toast.success("Expense deleted");
      router.push("/expenses");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Expense" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!expense) return null;

  const cat = getCategoryById(expense.category_id);
  const sub = expense.subcategory_id ? getSubcategoryById(expense.subcategory_id) : null;
  const card = expense.card_id ? getCardById(expense.card_id) : null;

  if (isEditing) {
    return (
      <>
        <Header title="Edit Expense" showBackButton />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto p-4 md:p-6 space-y-6">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl h-14 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.emoji || c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredSubcategories.length > 0 && (
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {filteredSubcategories.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); if (v !== "card") setCardId(""); }}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "card" && cards.length > 0 && (
              <div className="space-y-2">
                <Label>Card</Label>
                <Select value={cardId} onValueChange={setCardId}>
                  <SelectTrigger><SelectValue placeholder="Select card" /></SelectTrigger>
                  <SelectContent>
                    {cards.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label || c.bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={2} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Expense" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 md:p-6 space-y-6">
          {/* Amount & Category */}
          <Card>
            <CardContent className="pt-6 text-center">
              <span className="text-4xl mb-2 block">{cat?.emoji || cat?.icon || "📦"}</span>
              <p className="text-3xl font-serif font-semibold text-primary">
                {formatCurrency(Number(expense.amount))}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{cat?.name}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub.name}</p>}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {expense.title && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Title</p>
                  <p className="text-sm font-medium">{expense.title}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
                <p className="text-sm font-medium">{formatDate(expense.date)}</p>
              </div>

              {expense.payment_method && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Payment</p>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {expense.payment_method === "card" ? <CreditCard size={14} /> : <Banknote size={14} />}
                    {expense.payment_method === "card" && card ? card.label || card.bank : expense.payment_method}
                  </div>
                </div>
              )}

              {expense.note && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Note</p>
                  <p className="text-sm">{expense.note}</p>
                </div>
              )}

              {expense.comments && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Comments</p>
                  <p className="text-sm">{expense.comments}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
