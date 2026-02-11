"use client";

import type { Category } from "@/lib/types";

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "md" }: CategoryBadgeProps) {
  const emoji = category.emoji || category.icon;

  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1 text-xs">
        <span>{emoji}</span>
        <span className="text-muted-foreground">{category.name}</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted text-sm">
      <span>{emoji}</span>
      <span className="font-medium">{category.name}</span>
    </div>
  );
}
