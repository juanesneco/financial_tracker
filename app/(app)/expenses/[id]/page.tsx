"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2, Trash2, CreditCard, Banknote, Pencil, ChevronRight, ImageIcon, ImageOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import Link from "next/link";
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
import { useCategories } from "@/hooks/useCategories";

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const expenseId = params.id as string;

  const fromParam = searchParams.get("from");
  const subcategoryIdParam = searchParams.get("subcategoryId");
  const originMap: Record<string, { label: string; href: string }> = {
    home: { label: "Home", href: "/" },
    expenses: { label: "Expenses", href: "/expenses" },
    balance: { label: "Balance", href: "/balance" },
    ...(subcategoryIdParam
      ? { subcategory: { label: "Subcategory", href: `/settings/categories/subcategory/${subcategoryIdParam}` } }
      : {}),
  };
  const origin = originMap[fromParam || ""] || originMap.expenses;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { categories, subcategories, flatSortedSubcategories, subcategoryMap } = useCategories();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);

  // Edit form state
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardId, setCardId] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: exp },
          { data: userCards },
        ] = await Promise.all([
          supabase.from("ft_expenses").select("*").eq("id", expenseId).single(),
          supabase.from("ft_cards").select("*").order("bank"),
        ]);

        if (!exp) {
          toast.error("Expense not found");
          router.push("/expenses");
          return;
        }

        const e = exp as Expense;
        setExpense(e);
        setCards((userCards || []) as CardType[]);

        // Initialize form
        setAmount(String(e.amount));
        setTitle(e.title || "");
        setSubcategoryId(e.subcategory_id || "");
        setDate(e.date);
        setNote(e.note || "");
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

  const categoryId = subcategoryMap.get(subcategoryId)?.categoryId || "";

  const handleSave = async () => {
    if (!title.trim() || !amount || !subcategoryId || !categoryId || !date) {
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
          subcategory_id: subcategoryId,
          date,
          note: note.trim() || null,
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
          <div className="max-w-lg lg:max-w-full mx-auto p-4 md:p-6 space-y-6">
            {/* 1. Date */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 py-2.5 md:h-9 md:py-1" />
            </div>

            {/* 2. Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                <SelectTrigger className="w-full h-11 md:h-9">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[240px]">
                  {flatSortedSubcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.categoryEmoji} {sub.categoryName} - {sub.emoji ? `${sub.emoji} ` : ""}{sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What was this for?" required className="h-11 py-2.5 md:h-9 md:py-1" />
            </div>

            {/* 5. Amount */}
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl h-14 font-semibold px-4 py-3"
              />
            </div>

            {/* 6. Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); if (v !== "card") setCardId(""); }}>
                <SelectTrigger className="w-full h-11 md:h-9"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Card Selector */}
            {paymentMethod === "card" && cards.length > 0 && (() => {
              const availableCards = cards.filter(c =>
                !c.deactivated_at ||
                c.id === cardId ||
                (c.deactivated_at && date && c.deactivated_at >= date)
              );
              return availableCards.length > 0 ? (
                <div className="space-y-2">
                  <Label>Card</Label>
                  <Select value={cardId} onValueChange={setCardId}>
                    <SelectTrigger className="w-full h-11 md:h-9"><SelectValue placeholder="Select card" /></SelectTrigger>
                    <SelectContent>
                      {availableCards.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label || c.bank}{c.deactivated_at ? " (inactive)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null;
            })()}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Additional details (optional)" className="py-3 min-h-[72px] md:min-h-[64px]" />
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
      <Header title="Expense" showBackButton backHref={origin.href} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg lg:max-w-full mx-auto p-4 md:p-6 space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href={origin.href} className="hover:text-foreground transition-colors">
              {origin.label}
            </Link>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium truncate">
              {expense.title || cat?.name || "Detail"}
            </span>
          </nav>

          {/* Amount, Category & Actions */}
          <Card>
            <CardContent className="pt-6 text-center">
              <span className="text-4xl mb-2 block">{cat?.emoji || cat?.icon || "📦"}</span>
              <p className="text-3xl font-serif font-semibold text-primary">
                {formatCurrency(Number(expense.amount))}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{cat?.name}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub.name}</p>}

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
                  <Pencil size={14} className="mr-2" />
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{expense.note}</p>
                </div>
              )}

              {/* Receipt hint */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Receipt</p>
                <div className="flex items-center gap-2 text-sm mt-1">
                  {expense.receipt_url ? (
                    <>
                      <ImageIcon size={14} className="text-primary" />
                      <span className="text-primary font-medium">Image attached</span>
                    </>
                  ) : (
                    <>
                      <ImageOff size={14} className="text-muted-foreground" />
                      <span className="text-muted-foreground">No image attached</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
