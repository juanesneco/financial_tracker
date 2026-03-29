"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2, Trash2, Pencil, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getIncomeRecordById, getIncomeSources, updateIncomeRecord, deleteIncomeRecord } from "@/lib/supabase/queries";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { IncomeRecord, IncomeSource } from "@/lib/types";

export default function IncomeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const recordId = params.id as string;

  const fromParam = searchParams.get("from");
  const originMap: Record<string, { label: string; href: string }> = {
    balance: { label: "Balance", href: "/balance" },
  };
  const origin = originMap[fromParam || ""] || originMap.balance;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [record, setRecord] = useState<IncomeRecord | null>(null);
  const [sources, setSources] = useState<IncomeSource[]>([]);

  // Edit form state
  const [date, setDate] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: rec }, { data: srcs }] = await Promise.all([
          getIncomeRecordById(supabase, recordId),
          getIncomeSources(supabase),
        ]);

        if (!rec) {
          toast.error("Income record not found");
          router.push("/balance");
          return;
        }

        const r = rec as IncomeRecord;
        setRecord(r);
        setSources(srcs ?? []);

        // Initialize form
        setDate(r.date);
        setSourceId(r.income_source_id || "");
        setDescription(r.description || "");
        setAmount(String(r.amount));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase, recordId, router]);

  const getSourceById = (id: string) => sources.find((s) => s.id === id);

  const handleSave = async () => {
    if (!date || !sourceId || !description.trim() || !amount) {
      toast.error("Please fill required fields");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await updateIncomeRecord(supabase, recordId, {
        date,
        income_source_id: sourceId || null,
        description: description.trim() || null,
        amount: parseFloat(amount),
      });

      if (error) {
        toast.error("Failed to update income record");
        return;
      }

      toast.success("Income updated");
      setIsEditing(false);

      const { data: updated } = await getIncomeRecordById(supabase, recordId);
      if (updated) setRecord(updated as IncomeRecord);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this income record?")) return;

    setIsDeleting(true);
    try {
      const { error } = await deleteIncomeRecord(supabase, recordId);
      if (error) {
        toast.error("Failed to delete income record");
        return;
      }

      toast.success("Income record deleted");
      router.push("/balance");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Income" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!record) return null;

  const source = record.income_source_id ? getSourceById(record.income_source_id) : null;

  if (isEditing) {
    return (
      <>
        <Header title="Edit Income" showBackButton />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-lg lg:max-w-full mx-auto p-4 md:p-6 space-y-6">
            {/* 1. Date */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 py-2.5 md:h-9 md:py-1 w-full max-w-full min-w-0 overflow-hidden"
              />
            </div>

            {/* 2. Source */}
            <div className="space-y-2">
              <Label>Source *</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger className="w-full h-11 md:h-9">
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[240px]">
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.initials ? `${s.initials} — ` : ""}{s.source_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., March paycheck"
                rows={2}
                className="py-3 min-h-[72px] md:min-h-[64px]"
              />
            </div>

            {/* 4. Amount */}
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl h-14 font-semibold px-4 py-3"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Income" showBackButton backHref={origin.href} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg lg:max-w-full mx-auto p-4 md:p-6 space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href={origin.href} className="hover:text-foreground transition-colors">
              {origin.label}
            </Link>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium truncate">
              {record.description || source?.source_name || "Detail"}
            </span>
          </nav>

          {/* Amount, Source & Actions */}
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                <span className="text-emerald-600 font-semibold text-sm">
                  {source?.initials || source?.source_name?.slice(0, 2).toUpperCase() || "$"}
                </span>
              </div>
              <p className="text-3xl font-serif font-semibold text-emerald-600">
                +{formatCurrency(Number(record.amount))}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{source?.source_name || "Unknown source"}</p>

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
                  <Pencil size={14} className="mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {record.description && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Description</p>
                  <p className="text-sm font-medium">{record.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
                <p className="text-sm font-medium">{formatDate(record.date)}</p>
              </div>

              {source?.legal_name && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Legal Name</p>
                  <p className="text-sm font-medium">{source.legal_name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
