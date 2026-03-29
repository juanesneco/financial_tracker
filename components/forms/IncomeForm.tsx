"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getIncomeSources, insertIncomeRecord } from "@/lib/supabase/queries";
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
import { format } from "date-fns";
import type { IncomeSource } from "@/lib/types";

interface IncomeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

export function IncomeForm({ onSuccess, onCancel, isSheet }: IncomeFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function fetchSources() {
      const { data } = await getIncomeSources(supabase);
      setSources((data || []) as IncomeSource[]);
      setIsLoading(false);
    }
    fetchSources();
  }, [supabase]);

  // Redirect to income sources page when user has none (new users must add sources first)
  useEffect(() => {
    if (!isLoading && sources.length === 0) {
      onCancel?.();
      router.push("/income");
    }
  }, [isLoading, sources.length, router, onCancel]);

  const resetForm = () => {
    setAmount("");
    setSourceId("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !sourceId || !description.trim() || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }

      const { error } = await insertIncomeRecord(supabase, {
        user_id: user.id,
        amount: parseFloat(amount),
        date,
        income_source_id: sourceId || null,
        description: description || null,
      });

      if (error) { toast.error("Failed to save income"); return; }
      toast.success("Income recorded!");
      resetForm();

      if (isSheet && onSuccess) {
        onSuccess();
      } else {
        router.push("/balance");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No income sources: useEffect redirects to /income; show brief message while redirecting
  if (sources.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Redirecting to add income sources…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Date */}
      <div className="space-y-2">
        <Label htmlFor="income-date">Date *</Label>
        <Input
          id="income-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          disabled={isSubmitting}
          className="h-11 py-2.5 md:h-9 md:py-1 w-full max-w-full min-w-0 overflow-hidden"
        />
      </div>

      {/* 2. Source */}
      <div className="space-y-2">
        <Label>Source *</Label>
        <Select value={sourceId} onValueChange={setSourceId} disabled={isSubmitting}>
          <SelectTrigger className="w-full h-11 md:h-9">
            <SelectValue placeholder="Select a source" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[240px]">
            {sources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.initials ? `${source.initials} — ` : ""}{source.source_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3. Description */}
      <div className="space-y-2">
        <Label htmlFor="income-description">Description *</Label>
        <Textarea
          id="income-description"
          placeholder="e.g., March paycheck"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={isSubmitting}
          rows={2}
          className="py-3 min-h-[72px] md:min-h-[64px]"
        />
      </div>

      {/* 4. Amount */}
      <div className="space-y-2">
        <Label htmlFor="income-amount">Amount *</Label>
        <Input
          id="income-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={isSubmitting}
          className="text-2xl h-14 font-semibold px-4 py-3"
        />
      </div>

      {/* Actions */}
      <div className={isSheet ? "flex gap-2" : ""}>
        {isSheet && onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className={isSheet ? "flex-1" : "w-full h-12 text-base"}
          disabled={isSubmitting || !date || !sourceId || !description.trim() || !amount}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Income"
          )}
        </Button>
      </div>
    </form>
  );
}
