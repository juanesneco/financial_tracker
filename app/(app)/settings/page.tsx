"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("MXN");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setEmail(user.email || "");

        const { data } = await supabase.from("ft_profiles").select("*").eq("id", user.id).single();
        if (data) {
          const p = data as Profile;
          setProfile(p);
          setDisplayName(p.display_name || "");
          setCurrency(p.currency || "MXN");
        }
      } finally { setIsLoading(false); }
    }
    fetchProfile();
  }, [supabase]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ft_profiles")
        .update({ display_name: displayName, currency })
        .eq("id", profile.id);

      if (error) { toast.error("Failed to save"); return; }
      toast.success("Profile updated");
    } finally { setIsSaving(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <>
        <Header title="Settings" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 md:p-6 space-y-6">
          {/* Profile */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-serif text-lg font-semibold">Profile</h3>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold">
                  {displayName ? displayName[0].toUpperCase() : "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{displayName || "No name set"}</p>
                  <p className="text-xs text-muted-foreground">{email}</p>
                  {profile?.is_super_admin && <Badge className="mt-1 text-[10px]">Admin</Badge>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN (Mexican Peso)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Role info */}
          {profile && (
            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-serif text-lg font-semibold">Account</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span>{profile.role || "member"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member since</span>
                  <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logout */}
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </main>
    </>
  );
}
