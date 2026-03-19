"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Subcategory } from "@/lib/types";

export interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  subcategories: { id: string; name: string; emoji: string | null }[];
}

export interface SubcategoryInfo {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  name: string;
}

interface UseCategoriesReturn {
  categories: Category[];
  visibleCategories: Category[];
  hiddenCategoryIds: Set<string>;
  subcategories: Subcategory[];
  groupedSubcategories: CategoryGroup[];
  subcategoryMap: Map<string, SubcategoryInfo>;
  isLoading: boolean;
  refetch: () => Promise<void>;
  hideCategory: (categoryId: string) => Promise<void>;
  unhideCategory: (categoryId: string) => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [catsRes, subsRes, hiddenRes] = await Promise.all([
        supabase.from("ft_categories").select("*").order("display_order"),
        supabase.from("ft_subcategories").select("*").order("display_order"),
        supabase.from("ft_user_hidden_categories").select("category_id").eq("user_id", user.id),
      ]);

      setCategories((catsRes.data || []) as Category[]);
      setSubcategories((subsRes.data || []) as Subcategory[]);
      setHiddenCategoryIds(
        new Set((hiddenRes.data || []).map((r: { category_id: string }) => r.category_id))
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.is_displayed !== false && !hiddenCategoryIds.has(c.id)),
    [categories, hiddenCategoryIds]
  );

  const groupedSubcategories = useMemo(() => {
    return visibleCategories
      .map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryEmoji: cat.emoji || cat.icon || "",
        subcategories: subcategories
          .filter((s) => s.category_id === cat.id)
          .map((s) => ({ id: s.id, name: s.name, emoji: s.emoji || null })),
      }))
      .filter((g) => g.subcategories.length > 0);
  }, [visibleCategories, subcategories]);

  const subcategoryMap = useMemo(() => {
    const map = new Map<string, SubcategoryInfo>();
    for (const group of groupedSubcategories) {
      for (const sub of group.subcategories) {
        map.set(sub.id, {
          categoryId: group.categoryId,
          categoryName: group.categoryName,
          categoryEmoji: group.categoryEmoji,
          name: sub.name,
        });
      }
    }
    return map;
  }, [groupedSubcategories]);

  const hide = useCallback(async (categoryId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("ft_user_hidden_categories").insert({ user_id: user.id, category_id: categoryId });
    setHiddenCategoryIds((prev) => new Set([...prev, categoryId]));
  }, [supabase]);

  const unhide = useCallback(async (categoryId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("ft_user_hidden_categories").delete().eq("user_id", user.id).eq("category_id", categoryId);
    setHiddenCategoryIds((prev) => {
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  }, [supabase]);

  return {
    categories,
    visibleCategories,
    hiddenCategoryIds,
    subcategories,
    groupedSubcategories,
    subcategoryMap,
    isLoading,
    refetch: fetchAll,
    hideCategory: hide,
    unhideCategory: unhide,
  };
}
