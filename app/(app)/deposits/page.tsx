"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Deposit } from "@/lib/types";

export default function DepositsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");

  async function fetchDeposits() {
    const { data } = await supabase
      .from("ft_deposits")
      .select("*")
      .order("date", { ascending: false })
      .limit(100);
    setDeposits((data || []) as Deposit[]);
    setIsLoading(false);
  }

  useEffect(() => { fetchDeposits(); }, [supabase]);

  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0);

  const handleAdd = async () => {
    if (!amount || !date) { toast.error("Amount and date required"); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("ft_deposits").insert({
        user_id: user.id,
        amount: parseFloat(amount),
        date,
        title: title || null,
        note: note || null,
      });

      if (error) { toast.error("Failed to add deposit"); return; }
      toast.success("Deposit added");
      setShowForm(false); setAmount(""); setTitle(""); setNote("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      fetchDeposits();
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deposit?")) return;
    const { error } = await supabase.from("ft_deposits").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    fetchDeposits();
  };

  if (isLoading) {
    return (
      <>
        <Header title="Deposits" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Deposits" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 md:p-6 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Total Deposits</p>
              <p className="text-2xl font-serif font-semibold text-primary">{formatCurrency(totalDeposits)}</p>
              <p className="text-xs text-muted-foreground mt-1">{deposits.length} deposits</p>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Recent deposits</p>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus size={16} /> Add
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="text-xl h-12 font-semibold" />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Repayment from Ivonne" />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
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

          <Card className="py-0 gap-0 divide-y">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{deposit.title || "Deposit"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(deposit.date)}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-primary">
                  +{formatCurrency(Number(deposit.amount))}
                </p>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(deposit.id)}>
                  <Trash2 size={14} className="text-muted-foreground" />
                </Button>
              </div>
            ))}
            {deposits.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">No deposits yet</div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
