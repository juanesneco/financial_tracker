"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format-utils";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { IncomeSource } from "@/lib/types";

export default function IncomePage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [sourceName, setSourceName] = useState("");
  const [initials, setInitials] = useState("");
  const [legalName, setLegalName] = useState("");

  async function fetchSources() {
    const { data } = await supabase.from("ft_income_sources").select("*").order("source_name");
    setSources((data || []) as IncomeSource[]);
    setIsLoading(false);
  }

  useEffect(() => { fetchSources(); }, [supabase]);

  const handleAdd = async () => {
    if (!sourceName) { toast.error("Source name required"); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("ft_income_sources").insert({
        user_id: user.id,
        source_name: sourceName,
        initials: initials || null,
        legal_name: legalName || null,
      });

      if (error) { toast.error("Failed to add"); return; }
      toast.success("Income source added");
      setShowForm(false); setSourceName(""); setInitials(""); setLegalName("");
      fetchSources();
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this income source?")) return;
    const { error } = await supabase.from("ft_income_sources").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    fetchSources();
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

  return (
    <>
      <Header title="Income" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{sources.length} source{sources.length !== 1 ? "s" : ""}</p>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus size={16} /> Add Source
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Source Name *</Label>
                  <Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g., Duplica" />
                </div>
                <div className="space-y-2">
                  <Label>Initials</Label>
                  <Input value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="e.g., DUP" maxLength={5} />
                </div>
                <div className="space-y-2">
                  <Label>Legal Name</Label>
                  <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Legal entity name" />
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
            {sources.map((source) => (
              <Card key={source.id} className="py-3">
                <CardContent className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                    {source.initials || source.source_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{source.source_name}</p>
                    {source.legal_name && (
                      <p className="text-xs text-muted-foreground truncate">{source.legal_name}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(source.id)}>
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
