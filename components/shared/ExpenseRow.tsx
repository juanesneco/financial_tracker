"use client";

import Link from "next/link";
import { CreditCard, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/format-utils";
import type { Expense, Category } from "@/lib/types";

interface ExpenseRowProps {
  expense: Expense;
  category?: Category;
}

export function ExpenseRow({ expense, category }: ExpenseRowProps) {
  return (
    <Link
      href={`/expenses/${expense.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <span className="text-lg">{category?.emoji || category?.icon || "📦"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {expense.title || expense.note || category?.name || "Expense"}
        </p>
        <p className="text-xs text-muted-foreground">{category?.name}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {expense.payment_method === "card" && <CreditCard size={12} className="text-muted-foreground" />}
        {expense.payment_method === "cash" && <Banknote size={12} className="text-muted-foreground" />}
        <p className="text-sm font-semibold tabular-nums">
          {formatCurrency(Number(expense.amount))}
        </p>
      </div>
    </Link>
  );
}
