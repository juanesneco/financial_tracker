"use client";

import { Header } from "@/components/layout/Header";
import { IncomeForm } from "@/components/forms/IncomeForm";

export default function AddIncomePage() {
  return (
    <>
      <Header title="Add Income" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 md:p-6">
          <IncomeForm />
        </div>
      </main>
    </>
  );
}
