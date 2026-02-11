"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, CreditCard, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Card as CardType } from "@/lib/types";

export default function CardsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<CardType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [bank, setBank] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [cardType, setCardType] = useState("");

  async function fetchCards() {
    const { data } = await supabase.from("ft_cards").select("*").order("bank");
    setCards((data || []) as CardType[]);
    setIsLoading(false);
  }

  useEffect(() => { fetchCards(); }, [supabase]);

  const handleAdd = async () => {
    if (!bank) { toast.error("Bank is required"); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const validType = cardType === "credit" || cardType === "debit" ? cardType : null;
      const label = [bank, validType ? validType.charAt(0).toUpperCase() + validType.slice(1) : null, lastFour ? `(${lastFour})` : null].filter(Boolean).join(" ");

      const { error } = await supabase.from("ft_cards").insert({
        user_id: user.id, bank, last_four: lastFour || null, card_type: validType, label,
      });

      if (error) { toast.error("Failed to add card"); return; }
      toast.success("Card added");
      setShowForm(false);
      setBank(""); setLastFour(""); setCardType("");
      fetchCards();
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this card?")) return;
    const { error } = await supabase.from("ft_cards").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Card deleted");
    fetchCards();
  };

  if (isLoading) {
    return (
      <>
        <Header title="Cards" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Cards" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{cards.length} card{cards.length !== 1 ? "s" : ""}</p>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus size={16} /> Add Card
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Bank *</Label>
                  <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="e.g., BBVA" />
                </div>
                <div className="space-y-2">
                  <Label>Last 4 Digits</Label>
                  <Input value={lastFour} onChange={(e) => setLastFour(e.target.value)} maxLength={4} placeholder="1234" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={cardType} onValueChange={setCardType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleAdd} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {cards.map((card) => (
              <Card key={card.id} className="py-3">
                <CardContent className="flex items-center gap-3">
                  {card.card_type === "credit" ? <CreditCard size={20} className="text-primary" /> : <Banknote size={20} className="text-primary" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{card.label || card.bank}</p>
                    <p className="text-xs text-muted-foreground">
                      {card.card_type ? card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1) : "Card"}
                      {card.last_four ? ` ending in ${card.last_four}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(card.id)}>
                    <Trash2 size={14} className="text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
