"use client";

import { Header } from "@/components/layout/Header";
import { ExpenseForm } from "@/components/forms/ExpenseForm";

export default function AddExpensePage() {
  return (
    <>
      <Header title="Add Expense" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 md:p-6">
          <ExpenseForm />
        </div>
      </main>
    </>
  );
}
