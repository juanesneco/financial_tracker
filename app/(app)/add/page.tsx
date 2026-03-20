"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import type { ExpenseFormDefaults } from "@/components/forms/ExpenseForm";
import { toast } from "sonner";

export default function AddExpensePage() {
  const searchParams = useSearchParams();
  const fromScan = searchParams.get("from") === "scan";
  const [defaults, setDefaults] = useState<ExpenseFormDefaults | undefined>(undefined);
  const [ready, setReady] = useState(!fromScan);

  useEffect(() => {
    if (!fromScan) return;

    const raw = sessionStorage.getItem("scanResult");
    sessionStorage.removeItem("scanResult");

    if (!raw) {
      setReady(true);
      return;
    }

    try {
      const scan = JSON.parse(raw);
      const d: ExpenseFormDefaults = {};

      if (scan.date) d.date = scan.date;
      if (scan.subcategory_id) d.subcategoryId = scan.subcategory_id;
      if (scan.title) d.title = scan.title;
      if (scan.amount) d.amount = String(scan.amount);
      if (scan.payment_method) d.paymentMethod = scan.payment_method;
      if (scan.receiptPreview) d.receiptPreview = scan.receiptPreview;

      setDefaults(d);

      const missing = [];
      if (!scan.date) missing.push("date");
      if (!scan.subcategory_id) missing.push("category");
      if (!scan.title) missing.push("title");
      if (!scan.amount) missing.push("amount");

      if (missing.length > 0) {
        toast.warning(`Couldn't extract: ${missing.join(", ")}`);
      }
    } catch {
      toast.error("Failed to load scan results");
    }

    setReady(true);
  }, [fromScan]);

  if (!ready) return null;

  return (
    <>
      <Header title={fromScan ? "Review Expense" : "Add Expense"} showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 md:p-6">
          <ExpenseForm key={fromScan ? "scan" : "manual"} defaultValues={defaults} />
        </div>
      </main>
    </>
  );
}
