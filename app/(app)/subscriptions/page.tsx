"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Subscription } from "@/lib/types";

export default function SubscriptionsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [renewalDay, setRenewalDay] = useState("");

  async function fetchSubscriptions() {
    const { data } = await supabase
      .from("ft_subscriptions")
      .select("*")
      .order("is_active", { ascending: false })
      .order("title");
    setSubscriptions((data || []) as Subscription[]);
    setIsLoading(false);
  }

  useEffect(() => { fetchSubscriptions(); }, [supabase]);

  const activeTotal = subscriptions
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const handleAdd = async () => {
    if (!title || !amount) { toast.error("Title and amount required"); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const day = renewalDay ? parseInt(renewalDay) : null;
      const { error } = await supabase.from("ft_subscriptions").insert({
        user_id: user.id, title, amount: parseFloat(amount),
        renewal_day: day && day >= 1 && day <= 31 ? day : null, is_active: true,
      });

      if (error) { toast.error("Failed to add"); return; }
      toast.success("Subscription added");
      setShowForm(false); setTitle(""); setAmount(""); setRenewalDay("");
      fetchSubscriptions();
    } finally { setIsSaving(false); }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("ft_subscriptions").update({ is_active: !currentStatus }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    fetchSubscriptions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    const { error } = await supabase.from("ft_subscriptions").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    fetchSubscriptions();
  };

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
        <div className="max-w-lg mx-auto p-4 md:p-6 space-y-4">
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
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="py-3">
                <CardContent className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{sub.title}</p>
                      <Badge variant={sub.is_active ? "default" : "secondary"} className="text-[10px]">
                        {sub.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(sub.amount))}
                      {sub.renewal_day ? ` / day ${sub.renewal_day}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(sub.id, sub.is_active)}>
                    {sub.is_active ? "Pause" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(sub.id)}>
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
