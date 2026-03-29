"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getProfile, getExpensesBySubcategoryId, updateSubcategory, deleteSubcategory } from "@/lib/supabase/queries";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  Pencil,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import type { Expense, Profile } from "@/lib/types";

export default function SubcategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const subcategoryId = params.id as string;

  const { categories, subcategories, isLoading: catLoading, refetch } = useCategories();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const subcategory = subcategories.find((s) => s.id === subcategoryId);
  const parentCategory = subcategory
    ? categories.find((c) => c.id === subcategory.category_id)
    : null;

  // Fetch profile + expenses
  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: prof }, { data: exps }] = await Promise.all([
        getProfile(supabase, user.id),
        getExpensesBySubcategoryId(supabase, subcategoryId),
      ]);

      if (prof) setProfile(prof as Profile);
      setExpenses((exps || []) as Expense[]);
      setIsLoadingExpenses(false);
    }
    fetchData();
  }, [supabase, subcategoryId]);

  const isLoading = catLoading || isLoadingExpenses;

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const canEdit =
    subcategory &&
    (subcategory.user_id !== null || profile?.is_super_admin);

  // Group expenses by date
  const groupedExpenses = expenses.reduce<Record<string, Expense[]>>(
    (acc, exp) => {
      const key = exp.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(exp);
      return acc;
    },
    {}
  );
  const sortedDates = Object.keys(groupedExpenses).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const handleStartEdit = () => {
    if (!subcategory) return;
    setEditName(subcategory.name);
    setEditEmoji(subcategory.emoji || "");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await updateSubcategory(supabase, subcategoryId, { name: editName.trim(), emoji: editEmoji || null });
      if (error) {
        toast.error("Failed to update subcategory");
        return;
      }
      toast.success("Subcategory updated");
      setIsEditing(false);
      refetch();
    } finally {
      setIsSaving(false);
    }
  };

  const hasExpenses = expenses.length > 0;

  const handleDelete = async () => {
    if (hasExpenses) {
      toast.error(`Cannot delete — ${expenses.length} expense(s) are linked to this subcategory`);
      return;
    }
    if (!confirm("Delete this subcategory?")) return;

    setIsDeleting(true);
    try {
      const { error } = await deleteSubcategory(supabase, subcategoryId);
      if (error) {
        toast.error("Failed to delete subcategory");
        return;
      }
      toast.success("Subcategory deleted");
      router.push("/settings/categories");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Subcategory" showBackButton backHref={subcategory ? `/settings/categories?expanded=${subcategory.category_id}` : "/settings/categories"} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!subcategory) {
    return (
      <>
        <Header title="Subcategory" showBackButton backHref="/settings/categories" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Subcategory not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Subcategory" showBackButton backHref={subcategory ? `/settings/categories?expanded=${subcategory.category_id}` : "/settings/categories"} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg lg:max-w-full mx-auto p-4 md:p-6 space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              href={`/settings/categories?expanded=${subcategory.category_id}`}
              className="hover:text-foreground transition-colors"
            >
              Categories
            </Link>
            <ChevronRight size={14} />
            <span className="truncate">
              {parentCategory?.emoji || parentCategory?.icon}{" "}
              {parentCategory?.name}
            </span>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium truncate">
              {subcategory.name}
            </span>
          </nav>

          {/* Summary Card */}
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              {isEditing ? (
                <div className="flex items-center gap-2 max-w-xs mx-auto">
                  <Input
                    value={editEmoji}
                    onChange={(e) => setEditEmoji(e.target.value)}
                    placeholder="😀"
                    className="w-14 h-10 text-center text-lg"
                  />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 h-10"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editName.trim()}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-4xl block">
                    {subcategory.emoji || parentCategory?.emoji || parentCategory?.icon || "📦"}
                  </span>
                  <p className="text-lg font-semibold">{subcategory.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {parentCategory?.emoji || parentCategory?.icon}{" "}
                    {parentCategory?.name}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {subcategory.user_id === null ? "Universal" : "Custom"}
                  </Badge>
                </>
              )}

              {/* Stats */}
              <div className="flex justify-center gap-8 pt-3">
                <div>
                  <p className="text-2xl font-serif font-semibold text-primary">
                    {expenses.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Expenses</p>
                </div>
                <div>
                  <p className="text-2xl font-serif font-semibold text-primary">
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>

              {/* Actions */}
              {canEdit && !isEditing && (
                <div className="flex gap-3 pt-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleStartEdit}
                  >
                    <Pencil size={14} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleDelete}
                    disabled={isDeleting || hasExpenses}
                    title={
                      hasExpenses
                        ? `Cannot delete — ${expenses.length} linked expense(s)`
                        : "Delete subcategory"
                    }
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              )}
              {canEdit && hasExpenses && !isEditing && (
                <p className="text-xs text-muted-foreground pt-1">
                  Remove all linked expenses before deleting
                </p>
              )}
            </CardContent>
          </Card>

          {/* Expense List (mobile) / Table (desktop) */}
          {expenses.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No expenses in this subcategory
            </p>
          ) : (
            <>
              {/* Mobile: grouped list */}
              <div className="md:hidden space-y-4">
                {sortedDates.map((date) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      {formatDate(date)}
                    </p>
                    <Card>
                      <CardContent className="pt-2 pb-2 divide-y">
                        {groupedExpenses[date].map((exp) => {
                          const cat = categories.find(
                            (c) => c.id === exp.category_id
                          );
                          return (
                            <Link
                              key={exp.id}
                              href={`/expenses/${exp.id}?from=subcategory&subcategoryId=${subcategoryId}`}
                              className="flex items-center gap-3 py-3 hover:bg-muted/50 -mx-4 px-4 transition-colors"
                            >
                              <span className="text-lg">
                                {cat?.emoji || cat?.icon || "📦"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {exp.title || cat?.name || "Expense"}
                                </p>
                                {exp.note && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {exp.note}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm font-semibold tabular-nums">
                                {formatCurrency(Number(exp.amount))}
                              </p>
                            </Link>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <Card className="hidden md:block">
                <CardContent className="pt-4 pb-2">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="text-left pb-3 font-medium">Date</th>
                        <th className="text-left pb-3 font-medium">Title</th>
                        <th className="text-left pb-3 font-medium">Note</th>
                        <th className="text-left pb-3 font-medium">Payment</th>
                        <th className="text-right pb-3 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {expenses.map((exp) => {
                        const cat = categories.find(
                          (c) => c.id === exp.category_id
                        );
                        return (
                          <tr key={exp.id} className="group">
                            <td className="py-3 pr-4 text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(exp.date)}
                            </td>
                            <td className="py-3 pr-4">
                              <Link
                                href={`/expenses/${exp.id}?from=subcategory&subcategoryId=${subcategoryId}`}
                                className="text-sm font-medium hover:text-primary transition-colors"
                              >
                                {cat?.emoji || cat?.icon || "📦"}{" "}
                                {exp.title || cat?.name || "Expense"}
                              </Link>
                            </td>
                            <td className="py-3 pr-4 text-sm text-muted-foreground max-w-[200px] truncate">
                              {exp.note || "—"}
                            </td>
                            <td className="py-3 pr-4 text-sm text-muted-foreground capitalize whitespace-nowrap">
                              {exp.payment_method || "—"}
                            </td>
                            <td className="py-3 text-sm font-semibold tabular-nums text-right whitespace-nowrap">
                              {formatCurrency(Number(exp.amount))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  );
}
