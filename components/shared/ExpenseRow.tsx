"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format-utils";
import type { Expense, Category } from "@/lib/types";
import { PaymentMethodIcon } from "./PaymentMethodIcon";

interface ExpenseRowProps {
  expense: Expense;
  category?: Category;
}

export function ExpenseRow({ expense, category }: ExpenseRowProps) {
  return (
    <Link
      href={`/expenses/${expense.id}?from=expenses`}
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
        <PaymentMethodIcon method={expense.payment_method} size={12} />
        <p className="text-sm font-semibold tabular-nums">
          {formatCurrency(expense.amount)}
        </p>
      </div>
    </Link>
  );
}
