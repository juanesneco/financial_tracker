"use client";

import { useEffect, useState, type MouseEvent, Fragment } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getProfile, insertCategory, insertSubcategory, deleteCategory, deleteSubcategory, deleteSubcategoriesByIds, updateCategory, getExpenseCountsBySubcategoryIds, getExpenseCountByCategory } from "@/lib/supabase/queries";
import { useCategories } from "@/hooks/useCategories";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import {
  Loader2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { Profile } from "@/lib/types";

export default function CategoriesSettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    categories,
    hiddenCategoryIds,
    subcategories,
    isLoading,
    refetch,
    hideCategory,
    unhideCategory,
  } = useCategories();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(
    searchParams.get("expanded")
  );

  // Sync expanded state to URL so it persists across navigation
  const setExpanded = (id: string | null) => {
    setExpandedId(id);
    const url = id
      ? `/settings/categories?expanded=${id}`
      : "/settings/categories";
    router.replace(url, { scroll: false });
  };

  // Add category form state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");
  const [isSaving, setIsSaving] = useState(false);

  // Add subcategory form state
  const [addSubForCategory, setAddSubForCategory] = useState<string | null>(
    null
  );
  const [newSubName, setNewSubName] = useState("");
  const [newSubEmoji, setNewSubEmoji] = useState("");

  // Expense counts per subcategory { subcategory_id -> count }
  const [subExpenseCounts, setSubExpenseCounts] = useState<Record<string, number>>({});

  // Fetch profile for is_super_admin check
  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await getProfile(supabase, user.id);
      if (data) setProfile(data as Profile);
    }
    fetchProfile();
  }, [supabase]);

  // Fetch expense counts per subcategory
  useEffect(() => {
    async function fetchSubExpenseCounts() {
      if (subcategories.length === 0) return;
      const subIds = subcategories.map((s) => s.id);
      const { data } = await getExpenseCountsBySubcategoryIds(supabase, subIds);
      if (!data) return;
      const counts: Record<string, number> = {};
      for (const row of data) {
        counts[row.subcategory_id] = (counts[row.subcategory_id] || 0) + 1;
      }
      setSubExpenseCounts(counts);
    }
    fetchSubExpenseCounts();
  }, [supabase, subcategories]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await insertCategory(supabase, {
        name: newCatName.trim(),
        emoji: newCatEmoji || null,
        icon: newCatEmoji || "📦",
        color: newCatColor,
        user_id: user.id,
      });
      if (error) {
        toast.error("Failed to create category");
        return;
      }
      toast.success("Category created");
      setShowAddCategory(false);
      setNewCatName("");
      setNewCatEmoji("");
      setNewCatColor("#3b82f6");
      refetch();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubcategory = async (categoryId: string) => {
    if (!newSubName.trim()) return;
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await insertSubcategory(supabase, {
        category_id: categoryId,
        name: newSubName.trim(),
        emoji: newSubEmoji || null,
        user_id: user.id,
      });
      if (error) {
        toast.error("Failed to create subcategory");
        return;
      }
      toast.success("Subcategory created");
      setAddSubForCategory(null);
      setNewSubName("");
      setNewSubEmoji("");
      refetch();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // Check how many expenses use this category
    const { count } = await getExpenseCountByCategory(supabase, id);

    if (count && count > 0) {
      toast.error(`Cannot delete — ${count} expense(s) are linked to this category`);
      return;
    }

    if (!confirm("Delete this category and its subcategories?")) return;

    // Delete subcategories first, then the category
    const catSubs = subcategories.filter((s) => s.category_id === id);
    if (catSubs.length > 0) {
      await deleteSubcategoriesByIds(supabase, catSubs.map((s) => s.id));
    }

    const { error } = await deleteCategory(supabase, id);
    if (error) {
      toast.error("Failed to delete category");
      return;
    }
    toast.success("Category deleted");
    refetch();
  };

  const handleDeleteSubcategory = async (id: string, e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    const expenseCount = subExpenseCounts[id] || 0;
    if (expenseCount > 0) {
      toast.error(`Cannot delete — ${expenseCount} expense(s) are linked to this subcategory`);
      return;
    }

    if (!confirm("Delete this subcategory?")) return;

    const { error } = await deleteSubcategory(supabase, id);
    if (error) {
      toast.error("Failed to delete subcategory");
      return;
    }
    toast.success("Subcategory deleted");
    refetch();
  };

  const handleToggleDisplayed = async (id: string, currentValue: boolean) => {
    const { error } = await updateCategory(supabase, id, { is_displayed: !currentValue });
    if (error) {
      toast.error("Failed to update category");
      return;
    }
    toast.success(!currentValue ? "Category shown in dropdowns" : "Category hidden from dropdowns");
    refetch();
  };

  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  const renderAddSubcategory = (categoryId: string) =>
    addSubForCategory === categoryId ? (
      <div className="flex gap-2 items-end">
        <Input
          placeholder="Subcategory name"
          value={newSubName}
          onChange={(e) => setNewSubName(e.target.value)}
          className="flex-1 h-8 text-sm"
        />
        <Input
          placeholder="😀"
          value={newSubEmoji}
          onChange={(e) => setNewSubEmoji(e.target.value)}
          className="w-14 h-8 text-sm"
        />
        <Button
          size="sm"
          className="h-8"
          onClick={() => handleAddSubcategory(categoryId)}
          disabled={isSaving || !newSubName.trim()}
        >
          Add
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8"
          onClick={() => {
            setAddSubForCategory(null);
            setNewSubName("");
            setNewSubEmoji("");
          }}
        >
          ✕
        </Button>
      </div>
    ) : (
      <button
        onClick={() => {
          setAddSubForCategory(categoryId);
          setNewSubName("");
          setNewSubEmoji("");
        }}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1"
      >
        <Plus size={12} /> Add subcategory
      </button>
    );

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <Header title="Manage Categories" showBackButton backHref="/settings" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Header title="Manage Categories" showBackButton backHref="/settings" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg lg:max-w-full mx-auto p-4 md:p-6 space-y-4">
          {/* Add Category Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {categories.length} categories
            </p>
            <Button
              size="sm"
              onClick={() => setShowAddCategory(!showAddCategory)}
            >
              <Plus size={16} /> Add Category
            </Button>
          </div>

          {/* Add Category Form */}
          {showAddCategory && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Emoji</Label>
                    <Input
                      value={newCatEmoji}
                      onChange={(e) => setNewCatEmoji(e.target.value)}
                      placeholder="🏷️"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddCategory(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleAddCategory}
                    disabled={isSaving || !newCatName.trim()}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category List — Mobile cards */}
          <div className="md:hidden space-y-2">
            {sortedCategories.map((cat) => {
              const isHidden = hiddenCategoryIds.has(cat.id);
              const isUniversal = cat.user_id === null;
              const isExpanded = expandedId === cat.id;
              const catSubs = subcategories
                .filter((s) => s.category_id === cat.id)
                .sort((a, b) => a.name.localeCompare(b.name));
              const canEdit = !isUniversal || profile?.is_super_admin;
              const isNotDisplayed = !cat.is_displayed;

              return (
                <Card
                  key={cat.id}
                  className={isHidden || isNotDisplayed ? "opacity-50" : ""}
                >
                  <CardContent className="pt-4 pb-4 space-y-0">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setExpanded(isExpanded ? null : cat.id)
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                      <span className="text-lg">
                        {cat.emoji || cat.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cat.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isUniversal ? "Universal" : "Custom"} ·{" "}
                          {catSubs.length} subcategories
                          {isNotDisplayed && " · Hidden from dropdowns"}
                        </p>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleToggleDisplayed(cat.id, cat.is_displayed)}
                          className={`p-2 transition-colors ${cat.is_displayed ? "text-emerald-600 hover:text-muted-foreground" : "text-muted-foreground hover:text-emerald-600"}`}
                          title={cat.is_displayed ? "Hide from dropdowns" : "Show in dropdowns"}
                        >
                          {cat.is_displayed ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      )}
                      {isUniversal && (
                        <button
                          onClick={() =>
                            isHidden
                              ? unhideCategory(cat.id)
                              : hideCategory(cat.id)
                          }
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                          title={isHidden ? "Show category" : "Hide category"}
                        >
                          {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                      {canEdit && !isUniversal && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 ml-8 space-y-2">
                        {catSubs.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No subcategories
                          </p>
                        )}
                        {catSubs.map((sub) => {
                          const canEditSub =
                            sub.user_id !== null || profile?.is_super_admin;
                          const expCount = subExpenseCounts[sub.id] || 0;
                          const hasExp = expCount > 0;
                          return (
                            <Link
                              key={sub.id}
                              href={`/settings/categories/subcategory/${sub.id}`}
                              className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded -mx-2 px-2 transition-colors"
                            >
                              <span className="text-sm">{sub.emoji || "·"}</span>
                              <p className="text-sm flex-1">{sub.name}</p>
                              {expCount > 0 && (
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                  {expCount} expense{expCount !== 1 ? "s" : ""}
                                </span>
                              )}
                              {sub.user_id === null && (
                                <Badge variant="secondary" className="text-[10px]">Universal</Badge>
                              )}
                              {canEditSub && sub.user_id !== null && (
                                <button
                                  onClick={(e) => handleDeleteSubcategory(sub.id, e)}
                                  disabled={hasExp}
                                  className={`p-1 ${hasExp ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-destructive"}`}
                                  title={hasExp ? `Cannot delete — ${expCount} linked expense(s)` : "Delete subcategory"}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </Link>
                          );
                        })}
                        {renderAddSubcategory(cat.id)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Category List — Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="pt-4 pb-2">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left pb-3 font-medium w-8"></th>
                    <th className="text-left pb-3 font-medium">Category</th>
                    <th className="text-left pb-3 font-medium">Type</th>
                    <th className="text-right pb-3 font-medium">Subcategories</th>
                    <th className="text-center pb-3 font-medium">Displayed</th>
                    <th className="text-right pb-3 font-medium">Visibility</th>
                    <th className="text-right pb-3 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedCategories.map((cat) => {
                    const isHidden = hiddenCategoryIds.has(cat.id);
                    const isUniversal = cat.user_id === null;
                    const isExpanded = expandedId === cat.id;
                    const catSubs = subcategories
                      .filter((s) => s.category_id === cat.id)
                      .sort((a, b) => a.name.localeCompare(b.name));
                    const canEdit = !isUniversal || profile?.is_super_admin;
                    const isNotDisplayed = !cat.is_displayed;

                    return (
                      <Fragment key={cat.id}>
                        <tr className={`${isHidden || isNotDisplayed ? "opacity-50" : ""} hover:bg-muted/30`}>
                          <td className="py-3 pr-2">
                            <button
                              onClick={() => setExpanded(isExpanded ? null : cat.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{cat.emoji || cat.icon}</span>
                              <span className="text-sm font-medium">{cat.name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="secondary" className="text-[10px]">
                              {isUniversal ? "Universal" : "Custom"}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-sm text-muted-foreground text-right tabular-nums">
                            {catSubs.length}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            {canEdit && (
                              <button
                                onClick={() => handleToggleDisplayed(cat.id, cat.is_displayed)}
                                className={`p-1 transition-colors ${cat.is_displayed ? "text-emerald-600 hover:text-muted-foreground" : "text-muted-foreground hover:text-emerald-600"}`}
                                title={cat.is_displayed ? "Hide from dropdowns" : "Show in dropdowns"}
                              >
                                {cat.is_displayed ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                              </button>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {isUniversal && (
                              <button
                                onClick={() =>
                                  isHidden ? unhideCategory(cat.id) : hideCategory(cat.id)
                                }
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                title={isHidden ? "Show category" : "Hide category"}
                              >
                                {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {canEdit && !isUniversal && (
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && catSubs.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-2 pl-10">
                              <p className="text-xs text-muted-foreground">No subcategories</p>
                              {renderAddSubcategory(cat.id)}
                            </td>
                          </tr>
                        )}
                        {isExpanded && catSubs.map((sub) => {
                          const canEditSub = sub.user_id !== null || profile?.is_super_admin;
                          const expCount = subExpenseCounts[sub.id] || 0;
                          const hasExp = expCount > 0;
                          return (
                            <tr key={sub.id} className="bg-muted/20 hover:bg-muted/40">
                              <td className="py-2 pr-2"></td>
                              <td className="py-2 pr-4 pl-6">
                                <Link
                                  href={`/settings/categories/subcategory/${sub.id}`}
                                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                >
                                  <span>{sub.emoji || "·"}</span>
                                  <span>{sub.name}</span>
                                </Link>
                              </td>
                              <td className="py-2 pr-4">
                                {sub.user_id === null && (
                                  <Badge variant="secondary" className="text-[10px]">Universal</Badge>
                                )}
                              </td>
                              <td className="py-2 pr-4 text-sm text-muted-foreground text-right tabular-nums">
                                {expCount > 0 && (
                                  <span>{expCount} expense{expCount !== 1 ? "s" : ""}</span>
                                )}
                              </td>
                              <td className="py-2 pr-4"></td>
                              <td className="py-2 text-right">
                                {canEditSub && sub.user_id !== null && (
                                  <button
                                    onClick={(e) => handleDeleteSubcategory(sub.id, e)}
                                    disabled={hasExp}
                                    className={`p-1 ${hasExp ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-destructive"}`}
                                    title={hasExp ? `Cannot delete — ${expCount} linked expense(s)` : "Delete subcategory"}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {isExpanded && (
                          <tr className="bg-muted/10">
                            <td colSpan={6} className="py-2 pl-10">
                              {renderAddSubcategory(cat.id)}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
