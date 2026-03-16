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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Category, Subcategory, Card as CardType } from "@/lib/types";

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

export function ExpenseForm({ onSuccess, onCancel, isSheet }: ExpenseFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [comments, setComments] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [cardId, setCardId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, subsRes, cardsRes] = await Promise.all([
          supabase.from("ft_categories").select("*").order("display_order"),
          supabase.from("ft_subcategories").select("*").order("display_order"),
          supabase.from("ft_cards").select("*").order("bank"),
        ]);
        setCategories((catsRes.data || []) as Category[]);
        setSubcategories((subsRes.data || []) as Subcategory[]);
        setCards((cardsRes.data || []) as CardType[]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  const filteredSubcategories = subcategories.filter(
    (s) => s.category_id === categoryId
  );

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
    setAmount("");
    setTitle("");
    setCategoryId("");
    setSubcategoryId("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setNote("");
    setComments("");
    setPaymentMethod("");
    setCardId("");
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) {
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
      }

      const { error: insertError } = await supabase.from("ft_expenses").insert({
        user_id: user.id,
        amount: parseFloat(amount),
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        date,
        title: title || null,
        note: note || null,
        comments: comments || null,
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
      {/* Amount */}
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
          className="text-2xl h-14 font-semibold"
        />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="expense-title">Title</Label>
        <Input
          id="expense-title"
          placeholder="What was this for?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category *</Label>
        <Select
          value={categoryId}
          onValueChange={(val) => { setCategoryId(val); setSubcategoryId(""); }}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[240px]">
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.emoji || cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory */}
      {filteredSubcategories.length > 0 && (
        <div className="space-y-2">
          <Label>Subcategory</Label>
          <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={isSubmitting}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[240px]">
              {filteredSubcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.emoji ? `${sub.emoji} ` : ""}{sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Payment Method */}
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select
          value={paymentMethod}
          onValueChange={(val) => { setPaymentMethod(val); if (val !== "card") setCardId(""); }}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
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

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="expense-date">Date *</Label>
        <Input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="expense-note">Note</Label>
        <Textarea
          id="expense-note"
          placeholder="Short description"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isSubmitting}
          rows={2}
        />
      </div>

      {/* Comments */}
      <div className="space-y-2">
        <Label htmlFor="expense-comments">Comments</Label>
        <Textarea
          id="expense-comments"
          placeholder="Additional details"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={isSubmitting}
          rows={2}
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
          disabled={isSubmitting || !amount || !categoryId}
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
