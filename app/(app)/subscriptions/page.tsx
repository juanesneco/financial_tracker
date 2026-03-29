"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Pencil, ArrowUpDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSubscriptions, insertSubscription, updateSubscription, deleteSubscription, getCards } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import type { Subscription, Card as CardType } from "@/lib/types";

export default function SubscriptionsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add form
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [renewalDay, setRenewalDay] = useState("");
  const [cardId, setCardId] = useState("");

  // Sort
  const [sortBy, setSortBy] = useState<"day" | "title">("day");

  // Edit modal
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editRenewalDay, setEditRenewalDay] = useState("");
  const [editCardId, setEditCardId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    const [subsRes, cardsRes] = await Promise.all([
      getSubscriptions(supabase),
      getCards(supabase),
    ]);
    setSubscriptions(subsRes.data || []);
    setCards(cardsRes.data || []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeTotal = subscriptions
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + s.amount, 0);

  const parseRenewalDay = (value: string): number | null => {
    const day = value ? parseInt(value) : null;
    return day && day >= 1 && day <= 31 ? day : null;
  };

  const parseCardId = (value: string): string | null =>
    value && value !== "none" ? value : null;

  const handleAdd = async () => {
    if (!title || !amount) { toast.error("Title and amount required"); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await insertSubscription(supabase, {
        user_id: user.id,
        title,
        amount: parseFloat(amount),
        renewal_day: parseRenewalDay(renewalDay),
        is_active: true,
        card_id: parseCardId(cardId),
      });

      if (error) { toast.error("Failed to add"); return; }
      toast.success("Subscription added");
      setShowForm(false);
      setTitle("");
      setAmount("");
      setRenewalDay("");
      setCardId("");
      fetchData();
    } finally { setIsSaving(false); }
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setEditTitle(sub.title);
    setEditAmount(String(sub.amount));
    setEditRenewalDay(sub.renewal_day ? String(sub.renewal_day) : "");
    setEditCardId(sub.card_id || "none");
  };

  const handleUpdate = async () => {
    if (!editingSub) return;
    if (!editTitle || !editAmount) { toast.error("Title and amount required"); return; }
    setIsUpdating(true);
    try {
      const { error } = await updateSubscription(supabase, editingSub.id, {
        title: editTitle,
        amount: parseFloat(editAmount),
        renewal_day: parseRenewalDay(editRenewalDay),
        card_id: parseCardId(editCardId),
      });

      if (error) { toast.error("Failed to update"); return; }
      toast.success("Subscription updated");
      setEditingSub(null);
      fetchData();
    } finally { setIsUpdating(false); }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await updateSubscription(supabase, id, { is_active: !currentStatus });
    if (error) { toast.error("Failed to update"); return; }
    toast.success(currentStatus ? "Subscription paused" : "Subscription activated");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    const { error } = await deleteSubscription(supabase, id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    fetchData();
  };

  const sortSubs = (subs: Subscription[]) => {
    return [...subs].sort((a, b) => {
      if (sortBy === "day") {
        const dayA = a.renewal_day ?? 32;
        const dayB = b.renewal_day ?? 32;
        return dayA !== dayB ? dayA - dayB : a.title.localeCompare(b.title);
      }
      return a.title.localeCompare(b.title);
    });
  };

  const activeSubs = sortSubs(subscriptions.filter(s => s.is_active));
  const inactiveSubs = sortSubs(subscriptions.filter(s => !s.is_active));

  const getCardLabel = (id: string | null) => {
    if (!id) return null;
    const card = cards.find(c => c.id === id);
    return card ? (card.label || card.bank) : null;
  };

  const renderSubscriptionItem = (sub: Subscription) => (
    <div key={sub.id} className="flex items-center gap-3 py-3 px-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{sub.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(sub.amount)}
          {sub.renewal_day ? ` / day ${sub.renewal_day}` : ""}
          {getCardLabel(sub.card_id) ? ` · ${getCardLabel(sub.card_id)}` : ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => openEditModal(sub)}
      >
        <Pencil size={14} className="text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => toggleActive(sub.id, sub.is_active)}>
        {sub.is_active ? "Pause" : "Activate"}
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(sub.id)}>
        <Trash2 size={14} className="text-muted-foreground" />
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <>
        <Header title="Subscriptions" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Subscriptions" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg lg:max-w-full mx-auto p-4 md:p-6 space-y-4">
          {/* Monthly total */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Active Monthly Total</p>
              <p className="text-2xl font-serif font-semibold text-primary">{formatCurrency(activeTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {subscriptions.filter(s => s.is_active).length} active subscriptions
              </p>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{subscriptions.length} total</p>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus size={16} /> Add
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Netflix" />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Renewal Day (1-31)</Label>
                  <Input type="number" min="1" max="31" value={renewalDay} onChange={(e) => setRenewalDay(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Card (optional)</Label>
                  <Select value={cardId} onValueChange={setCardId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No card assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No card</SelectItem>
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.label || card.bank}
                        </SelectItem>
                      ))}
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

          {/* Sort toggle */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort by</span>
            <Button
              variant={sortBy === "day" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setSortBy("day")}
            >
              Renewal Day
            </Button>
            <Button
              variant={sortBy === "title" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setSortBy("title")}
            >
              Title
            </Button>
          </div>

          {/* Active / Inactive accordion */}
          {subscriptions.length > 0 ? (
            <Accordion type="multiple" defaultValue={["active", "inactive"]} className="space-y-2">
              {activeSubs.length > 0 && (
                <AccordionItem value="active" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="text-sm font-medium">Active</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{activeSubs.length} subscription{activeSubs.length !== 1 ? "s" : ""}</span>
                        <span className="text-sm font-semibold">{formatCurrency(activeTotal)}/mo</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="divide-y">
                      {activeSubs.map(renderSubscriptionItem)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {inactiveSubs.length > 0 && (
                <AccordionItem value="inactive" className="border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="text-sm font-medium text-muted-foreground">Inactive</span>
                      <span className="text-xs text-muted-foreground">{inactiveSubs.length} subscription{inactiveSubs.length !== 1 ? "s" : ""}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="divide-y">
                      {inactiveSubs.map(renderSubscriptionItem)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No subscriptions yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Subscription Modal */}
      <Dialog open={!!editingSub} onOpenChange={(open) => { if (!open) setEditingSub(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g., Netflix"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-renewal">Renewal Day (1-31)</Label>
              <Input
                id="edit-renewal"
                type="number"
                min="1"
                max="31"
                value={editRenewalDay}
                onChange={(e) => setEditRenewalDay(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Card (optional)</Label>
              <Select value={editCardId} onValueChange={setEditCardId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No card assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No card</SelectItem>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.label || card.bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingSub(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleUpdate} disabled={isUpdating || !editTitle || !editAmount}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
