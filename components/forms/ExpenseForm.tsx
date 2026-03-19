"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Card as CardType } from "@/lib/types";
import { useCategories } from "@/hooks/useCategories";

export interface ExpenseFormDefaults {
  date?: string;
  subcategoryId?: string;
  title?: string;
  amount?: string;
  paymentMethod?: string;
  receiptPreview?: string;
}

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isSheet?: boolean;
  defaultValues?: ExpenseFormDefaults;
}

export function ExpenseForm({ onSuccess, onCancel, isSheet, defaultValues }: ExpenseFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const { groupedSubcategories, subcategoryMap, isLoading: categoriesLoading } = useCategories();
  const [cards, setCards] = useState<CardType[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = categoriesLoading || cardsLoading;

  const [date, setDate] = useState(defaultValues?.date || format(new Date(), "yyyy-MM-dd"));
  const [subcategoryId, setSubcategoryId] = useState(defaultValues?.subcategoryId || "");
  const [title, setTitle] = useState(defaultValues?.title || "");
  const [amount, setAmount] = useState(defaultValues?.amount || "");
  const [paymentMethod, setPaymentMethod] = useState<string>(defaultValues?.paymentMethod || "");
  const [note, setNote] = useState("");
  const [cardId, setCardId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(defaultValues?.receiptPreview || null);

  useEffect(() => {
    async function fetchCards() {
      try {
        const { data } = await supabase.from("ft_cards").select("*").order("bank");
        setCards((data || []) as CardType[]);
      } finally {
        setCardsLoading(false);
      }
    }
    fetchCards();
  }, [supabase]);

  const categoryId = subcategoryMap.get(subcategoryId)?.categoryId || "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const resetForm = () => {
    setDate(format(new Date(), "yyyy-MM-dd"));
    setSubcategoryId("");
    setTitle("");
    setAmount("");
    setPaymentMethod("");
    setCardId("");
    setNote("");
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !subcategoryId || !categoryId || !date) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }

      let receiptUrl: string | null = null;
      if (receiptFile) {
        const fileExt = receiptFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, receiptFile);
        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Failed to upload receipt");
        } else {
          receiptUrl = fileName;
        }
      } else if (receiptPreview && receiptPreview.startsWith("data:")) {
        // Handle scanned receipt: convert base64 data URL to blob for upload
        const res = await fetch(receiptPreview);
        const blob = await res.blob();
        const ext = blob.type.split("/")[1] || "jpg";
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, blob);
        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Failed to upload receipt");
        } else {
          receiptUrl = fileName;
        }
      }

      const { error: insertError } = await supabase.from("ft_expenses").insert({
        user_id: user.id,
        amount: parseFloat(amount),
        category_id: categoryId,
        subcategory_id: subcategoryId,
        date,
        title: title.trim(),
        note: note.trim() || null,
        payment_method: paymentMethod || null,
        card_id: cardId || null,
        receipt_url: receiptUrl,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error("Failed to save expense");
        return;
      }

      toast.success("Expense added!");
      resetForm();

      if (isSheet && onSuccess) {
        onSuccess();
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Submit error:", error);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Date */}
      <div className="space-y-2">
        <Label htmlFor="expense-date">Date *</Label>
        <Input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          disabled={isSubmitting}
          className="h-11 py-2.5 md:h-9 md:py-1"
        />
      </div>

      {/* 2. Category */}
      <div className="space-y-2">
        <Label>Category *</Label>
        <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={isSubmitting}>
          <SelectTrigger className="w-full h-11 md:h-9">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[240px]">
            {groupedSubcategories.map((group) => (
              <SelectGroup key={group.categoryId}>
                <SelectLabel>{group.categoryEmoji} {group.categoryName}</SelectLabel>
                {group.subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {group.categoryEmoji} {group.categoryName} - {sub.emoji ? `${sub.emoji} ` : ""}{sub.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4. Title */}
      <div className="space-y-2">
        <Label htmlFor="expense-title">Title *</Label>
        <Input
          id="expense-title"
          placeholder="What was this for?"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          className="h-11 py-2.5 md:h-9 md:py-1"
        />
      </div>

      {/* 5. Amount */}
      <div className="space-y-2">
        <Label htmlFor="expense-amount">Amount *</Label>
        <Input
          id="expense-amount"
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

      {/* 6. Payment Method */}
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select
          value={paymentMethod}
          onValueChange={(val) => { setPaymentMethod(val); if (val !== "card") setCardId(""); }}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full h-11 md:h-9">
            <SelectValue placeholder="Optional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Card Selector */}
      {paymentMethod === "card" && cards.filter(c => !c.deactivated_at).length > 0 && (
        <div className="space-y-2">
          <Label>Card</Label>
          <Select value={cardId} onValueChange={setCardId} disabled={isSubmitting}>
            <SelectTrigger className="w-full h-11 md:h-9">
              <SelectValue placeholder="Select a card" />
            </SelectTrigger>
            <SelectContent>
              {cards.filter(c => !c.deactivated_at).map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.label || `${card.bank} ${card.last_four ? `(${card.last_four})` : ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="expense-note">Notes</Label>
        <Textarea
          id="expense-note"
          placeholder="Additional details (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isSubmitting}
          rows={2}
          className="py-3 min-h-[72px] md:min-h-[64px]"
        />
      </div>

      {/* Receipt */}
      <div className="space-y-2">
        <Label>Receipt</Label>
        {receiptPreview ? (
          <div className="relative rounded-lg overflow-hidden border">
            <Image
              src={receiptPreview}
              alt="Receipt preview"
              width={400}
              height={300}
              className="w-full h-48 object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={removeReceipt}
            >
              <X size={16} />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload size={24} className="text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Tap to upload receipt</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
          </label>
        )}
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
          disabled={isSubmitting || !title.trim() || !amount || !subcategoryId}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Expense"
          )}
        </Button>
      </div>
    </form>
  );
}
