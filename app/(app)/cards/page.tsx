"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, CreditCard, Banknote, Power, PowerOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { Card as CardType, Subscription } from "@/lib/types";

const isCardActive = (card: CardType) => !card.deactivated_at;

export default function CardsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<CardType[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [bank, setBank] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [cardType, setCardType] = useState("");

  async function fetchData() {
    const [cardsRes, subsRes] = await Promise.all([
      supabase.from("ft_cards").select("*").order("bank"),
      supabase.from("ft_subscriptions").select("*").eq("is_active", true),
    ]);
    setCards((cardsRes.data || []) as CardType[]);
    setSubscriptions((subsRes.data || []) as Subscription[]);
    setIsLoading(false);
  }

  useEffect(() => { fetchData(); }, [supabase]);

  const getActiveSubCount = (cardId: string) =>
    subscriptions.filter(s => s.card_id === cardId).length;

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
      fetchData();
    } finally { setIsSaving(false); }
  };

  const handleToggleActive = async (card: CardType) => {
    const active = isCardActive(card);
    const { error } = await supabase
      .from("ft_cards")
      .update({
        deactivated_at: active ? new Date().toISOString() : null,
      })
      .eq("id", card.id);

    if (error) {
      toast.error(`Failed to ${active ? "deactivate" : "activate"} card`);
      return;
    }
    toast.success(active ? "Card deactivated" : "Card activated");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const activeSubCount = getActiveSubCount(id);
    if (activeSubCount > 0) {
      toast.error(`Cannot delete — card has ${activeSubCount} active subscription${activeSubCount !== 1 ? "s" : ""}`);
      return;
    }
    if (!confirm("Delete this card?")) return;
    const { error } = await supabase.from("ft_cards").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete card");
      return;
    }
    toast.success("Card deleted");
    fetchData();
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

  const activeCards = cards.filter(isCardActive);
  const inactiveCards = cards.filter(c => !isCardActive(c));

  return (
    <>
      <Header title="Cards" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg lg:max-w-3xl mx-auto p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {activeCards.length} active{inactiveCards.length > 0 ? `, ${inactiveCards.length} inactive` : ""}
            </p>
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

          {/* ─── Mobile: Card layout ─────────────────────────────────────── */}
          <div className="md:hidden space-y-2">
            {cards.map((card) => {
              const subCount = getActiveSubCount(card.id);
              const active = isCardActive(card);
              return (
                <Card key={card.id} className={`py-3 ${!active ? "opacity-60" : ""}`}>
                  <CardContent className="flex items-center gap-3">
                    {card.card_type === "credit" ? <CreditCard size={20} className="text-primary" /> : <Banknote size={20} className="text-primary" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{card.label || card.bank}</p>
                        {!active && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {card.card_type ? card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1) : "Card"}
                          {card.last_four ? ` ending in ${card.last_four}` : ""}
                        </p>
                        {subCount > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {subCount} sub{subCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(card)}
                      title={active ? "Deactivate" : "Activate"}
                    >
                      {active
                        ? <PowerOff size={14} className="text-muted-foreground" />
                        : <Power size={14} className="text-emerald-600" />
                      }
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(card.id)}>
                      <Trash2 size={14} className="text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ─── Desktop: Table layout ───────────────────────────────────── */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Card</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Last 4</TableHead>
                      <TableHead className="text-center">Subscriptions</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cards.map((card) => {
                      const subCount = getActiveSubCount(card.id);
                      const active = isCardActive(card);
                      return (
                        <TableRow key={card.id} className={!active ? "opacity-60" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {card.card_type === "credit"
                                ? <CreditCard size={16} className="text-primary" />
                                : <Banknote size={16} className="text-primary" />
                              }
                              <span className="font-medium">{card.label || card.bank}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {card.card_type ? card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1) : "—"}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {card.last_four || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            {subCount > 0 ? (
                              <Badge variant="secondary" className="text-xs">
                                {subCount}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={active ? "default" : "outline"} className="text-xs">
                              {active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggleActive(card)}
                                title={active ? "Deactivate" : "Activate"}
                              >
                                {active
                                  ? <PowerOff size={14} className="text-muted-foreground" />
                                  : <Power size={14} className="text-emerald-600" />
                                }
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(card.id)}>
                                <Trash2 size={14} className="text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
