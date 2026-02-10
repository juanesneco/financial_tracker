"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, Plus, Trash2, Pencil, Check, X } from "lucide-react";

const colors = [
  { name: "Primary", var: "bg-primary", text: "text-primary-foreground", hex: "#4A7C6F / #6AAE9A" },
  { name: "Secondary", var: "bg-secondary", text: "text-secondary-foreground", hex: "#E8ECE9 / #333333" },
  { name: "Accent", var: "bg-accent", text: "text-accent-foreground", hex: "#D4915E / #E8A870" },
  { name: "Muted", var: "bg-muted", text: "text-muted-foreground", hex: "#F0F0EC / #333333" },
  { name: "Destructive", var: "bg-destructive", text: "text-destructive-foreground", hex: "#DC3545 / #EF5350" },
  { name: "Background", var: "bg-background", text: "text-foreground", hex: "#FAFAF8 / #1A1A1A" },
  { name: "Card", var: "bg-card", text: "text-card-foreground", hex: "#FFFFFF / #262626" },
  { name: "Border", var: "bg-border", text: "text-foreground", hex: "#D4D4CF / #3A3A3A" },
];

export default function DesignPage() {
  return (
    <>
      <Header title="Design Kit" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-12">

          {/* ── Color Palette ── */}
          <section>
            <h2 className="font-serif text-2xl font-semibold mb-1">Color Palette</h2>
            <p className="text-sm text-muted-foreground mb-4">Light / Dark values</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {colors.map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className={`${c.var} ${c.text} rounded-lg h-20 flex items-end p-2 border`}>
                    <span className="text-xs font-medium">{c.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">{c.hex}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* ── Typography ── */}
          <section>
            <h2 className="font-serif text-2xl font-semibold mb-4">Typography</h2>

            <div className="space-y-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Serif — DM Serif Display</p>
                <h1 className="font-serif text-4xl font-semibold">Heading 1 — The quick brown fox</h1>
                <h2 className="font-serif text-3xl font-semibold mt-2">Heading 2 — The quick brown fox</h2>
                <h3 className="font-serif text-2xl font-semibold mt-2">Heading 3 — The quick brown fox</h3>
                <h4 className="font-serif text-xl font-semibold mt-2">Heading 4 — The quick brown fox</h4>
                <h5 className="font-serif text-lg font-semibold mt-2">Heading 5 — The quick brown fox</h5>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Sans — Inter</p>
                <p className="text-base">Body — The quick brown fox jumps over the lazy dog. Clarity in every transaction.</p>
                <p className="text-sm text-muted-foreground mt-1">Small / Muted — Secondary text for descriptions and labels.</p>
                <p className="text-xs text-muted-foreground mt-1">Extra Small — Timestamps, captions, and metadata.</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Currency Display</p>
                <p className="text-4xl font-serif font-semibold text-primary">$12,450.00</p>
                <p className="text-2xl font-semibold tabular-nums mt-1">$1,234.56</p>
                <p className="text-sm font-semibold tabular-nums mt-1">$99.99</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Buttons ── */}
          <section>
            <h2 className="font-serif text-2xl font-semibold mb-4">Buttons</h2>

            <div className="space-y-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Variants</p>
                <div className="flex flex-wrap gap-3">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Sizes</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="lg">Large</Button>
                  <Button size="default">Default</Button>
                  <Button size="sm">Small</Button>
                  <Button size="icon"><Plus size={16} /></Button>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">With Icons</p>
                <div className="flex flex-wrap gap-3">
                  <Button><Plus size={16} /> Add Expense</Button>
                  <Button variant="outline"><Pencil size={16} /> Edit</Button>
                  <Button variant="destructive"><Trash2 size={16} /> Delete</Button>
                  <Button variant="secondary"><Check size={16} /> Confirm</Button>
                  <Button variant="ghost"><X size={16} /> Cancel</Button>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">States</p>
                <div className="flex flex-wrap gap-3">
                  <Button disabled>Disabled</Button>
                  <Button className="w-full h-12 text-base">Full Width (Submit)</Button>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Cards ── */}
          <section>
            <h2 className="font-serif text-2xl font-semibold mb-4">Cards</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">This month</p>
                  <p className="text-3xl font-serif font-semibold text-primary">$12,450.00</p>
                  <p className="text-xs text-muted-foreground mt-2">24 expenses</p>
                </CardContent>
              </Card>

              <Card className="py-3">
                <CardContent className="flex items-center gap-3">
                  <span className="text-xl">🍽️</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">Food & Dining</p>
                    <p className="font-semibold text-sm">$3,200.00</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="py-0 gap-0 divide-y sm:col-span-2">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">🍽️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Lunch at restaurant</p>
                    <p className="text-xs text-muted-foreground">Food & Dining</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">$245.00</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">🚗</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Uber ride to office</p>
                    <p className="text-xs text-muted-foreground">Transportation</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">$89.50</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">📱</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Netflix subscription</p>
                    <p className="text-xs text-muted-foreground">Subscriptions</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">$199.00</p>
                </div>
              </Card>
            </div>
          </section>

          <Separator />

          {/* ── Badges ── */}
          <section>
            <h2 className="font-serif text-2xl font-semibold mb-4">Badges</h2>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </section>

          <Separator />

          {/* ── Form Elements ── */}
          <section>
            <h2 className="font-serif text-2xl font-semibold mb-4">Form Elements</h2>

            <div className="space-y-6 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="demo-amount">Amount Input (Large)</Label>
                <Input
                  id="demo-amount"
                  type="number"
                  placeholder="0.00"
                  className="text-2xl h-14 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-text">Text Input</Label>
                <Input id="demo-text" placeholder="Enter text here..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-disabled">Disabled Input</Label>
                <Input id="demo-disabled" placeholder="Cannot edit" disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-date">Date Input</Label>
                <Input id="demo-date" type="date" defaultValue="2026-02-06" />
              </div>

              <div className="space-y-2">
                <Label>Select</Label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">🍽️ Food & Dining</SelectItem>
                    <SelectItem value="transport">🚗 Transportation</SelectItem>
                    <SelectItem value="housing">🏠 Housing</SelectItem>
                    <SelectItem value="entertainment">🎬 Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-textarea">Textarea</Label>
                <Textarea id="demo-textarea" placeholder="What was this for?" rows={3} />
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Iconography ── */}
          <section>
            <h2 className="font-serif text-2xl font-semibold mb-4">Icons & Emojis</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Lucide Icons</p>
                <div className="flex flex-wrap gap-4">
                  {[Wallet, Plus, Pencil, Trash2, Check, X].map((Icon, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{Icon.displayName}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Category Emojis</p>
                <div className="flex flex-wrap gap-3">
                  {["🍽️", "🚗", "🏠", "🎬", "🛍️", "💊", "📚", "📱", "💈", "✈️", "🎁", "📦"].map((emoji) => (
                    <span key={emoji} className="text-2xl">{emoji}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Spacing & Radius ── */}
          <section>
            <h2 className="font-serif text-2xl font-semibold mb-4">Border Radius</h2>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "sm", cls: "rounded-sm" },
                { label: "md", cls: "rounded-md" },
                { label: "lg", cls: "rounded-lg" },
                { label: "xl", cls: "rounded-xl" },
                { label: "full", cls: "rounded-full" },
              ].map((r) => (
                <div key={r.label} className="flex flex-col items-center gap-1">
                  <div className={`h-16 w-16 bg-primary ${r.cls}`} />
                  <span className="text-[10px] text-muted-foreground">{r.label}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="h-8" />
        </div>
      </main>
    </>
  );
}
