"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2, Trash2, CreditCard, Banknote, Pencil, ChevronRight, ImageIcon, ImageOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getExpenseById, getCards, deleteExpense } from "@/lib/supabase/queries";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Expense, Card as CardType } from "@/lib/types";
import { useCategories } from "@/hooks/useCategories";
import { ExpenseForm } from "@/components/forms/ExpenseForm";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { categories, subcategories } = useCategories();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: exp },
          { data: userCards },
        ] = await Promise.all([
          getExpenseById(supabase, expenseId),
          getCards(supabase),
        ]);

        if (!exp) {
          toast.error("Expense not found");
          router.push("/expenses");
          return;
        }

        setExpense(exp);
        setCards((userCards || []) as CardType[]);

        if (exp.receipt_url) {
          const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(exp.receipt_url);
          setReceiptPreviewUrl(urlData.publicUrl);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase, expenseId, router]);

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getSubcategoryById = (id: string) => subcategories.find(s => s.id === id);
  const getCardById = (id: string) => cards.find(c => c.id === id);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    setIsDeleting(true);
    try {
      const { error } = await deleteExpense(supabase, expenseId);
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
          <div className="max-w-lg lg:max-w-full mx-auto p-4 md:p-6">
            <ExpenseForm
              mode="edit"
              expenseId={expenseId}
              cards={cards}
              existingReceiptUrl={expense.receipt_url}
              defaultValues={{
                date: expense.date,
                subcategoryId: expense.subcategory_id || "",
                title: expense.title || "",
                amount: String(expense.amount),
                paymentMethod: expense.payment_method || "",
                cardId: expense.card_id || "",
                note: expense.note || "",
                receiptPreview: receiptPreviewUrl || undefined,
              }}
              onCancel={() => setIsEditing(false)}
              onSuccess={async () => {
                setIsEditing(false);
                const { data: updated } = await getExpenseById(supabase, expenseId);
                if (updated) {
                  const u = updated as Expense;
                  setExpense(u);
                  if (u.receipt_url) {
                    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(u.receipt_url);
                    setReceiptPreviewUrl(urlData.publicUrl);
                  } else {
                    setReceiptPreviewUrl(null);
                  }
                }
              }}
            />
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
