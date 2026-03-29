"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import type { ExpenseFormDefaults } from "@/components/forms/ExpenseForm";
import { format } from "date-fns";
import { toast } from "sonner";

interface ParsedScanData {
  date?: string;
  subcategory_id?: string;
  title?: string;
  amount?: number | string;
  payment_method?: string;
  receiptPreview?: string;
}

function loadDefaults(storageKey: string): ExpenseFormDefaults | undefined {
  const raw = sessionStorage.getItem(storageKey);
  sessionStorage.removeItem(storageKey);

  if (!raw) return undefined;

  try {
    const scan = JSON.parse(raw) as ParsedScanData;
    const d: ExpenseFormDefaults = {};

    if (scan.date) {
      d.date = scan.date;
    } else {
      d.date = format(new Date(), "yyyy-MM-dd");
    }
    if (scan.subcategory_id) d.subcategoryId = scan.subcategory_id;
    if (scan.title) d.title = scan.title;
    if (scan.amount) d.amount = String(scan.amount);
    if (scan.payment_method) d.paymentMethod = scan.payment_method;
    if (scan.receiptPreview) d.receiptPreview = scan.receiptPreview;

    const missing = [];
    if (!scan.subcategory_id) missing.push("category");
    if (!scan.title) missing.push("title");
    if (!scan.amount) missing.push("amount");

    if (!scan.date) {
      toast.info("Date not found, defaulting to today");
    }
    if (missing.length > 0) {
      toast.warning(`Couldn't extract: ${missing.join(", ")}`);
    }

    return d;
  } catch {
    toast.error("Failed to load scan results");
    return undefined;
  }
}

export default function AddExpensePage() {
  const searchParams = useSearchParams();
  const fromScan = searchParams.get("from") === "scan";
  const fromVoice = searchParams.get("from") === "voice";
  const hasDefaults = fromScan || fromVoice;

  const [defaults] = useState<ExpenseFormDefaults | undefined>(() => {
    if (!hasDefaults) return undefined;
    const storageKey = fromVoice ? "voiceResult" : "scanResult";
    return loadDefaults(storageKey);
  });

  return (
    <>
      <Header title={hasDefaults ? "Review Expense" : "Add Expense"} showBackButton />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-lg mx-auto p-4 md:p-6 overflow-hidden">
          <ExpenseForm key={hasDefaults ? "prefilled" : "manual"} defaultValues={defaults} />
        </div>
      </main>
    </>
  );
}
