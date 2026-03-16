"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Home,
  Receipt,
  Plus,
  BarChart3,
  Settings,
  CreditCard,
  RefreshCw,
  Target,
  DollarSign,
  ArrowDownCircle,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  Trash2,
  Edit3,
  Check,
  X,
  AlertCircle,
  Info,
  Bell,
  Eye,
  EyeOff,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Color Swatch Component ─────────────────────────────────────────────────

function ColorSwatch({
  name,
  variable,
  colorClass,
  textClass,
}: {
  name: string;
  variable: string;
  colorClass: string;
  textClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`h-16 w-full rounded-lg border ${colorClass} flex items-center justify-center`}
      >
        {textClass && (
          <span className={`text-xs font-medium ${textClass}`}>Aa</span>
        )}
      </div>
      <p className="text-xs font-medium truncate">{name}</p>
      <p className="text-[10px] text-muted-foreground font-mono truncate">
        {variable}
      </p>
    </div>
  );
}

// ─── Section Heading ─────────────────────────────────────────────────────────

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DesignKitPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("ft_profiles")
          .select("is_super_admin")
          .eq("id", user.id)
          .single();

        if (profile?.is_super_admin) {
          setIsAdmin(true);
        }
      } finally {
        setIsLoading(false);
      }
    }
    checkAccess();
  }, [supabase, router]);

  if (isLoading) {
    return (
      <>
        <Header title="Design Kit" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Header title="Design Kit" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="font-serif text-lg font-semibold">Access Denied</h2>
            <p className="text-sm text-muted-foreground">
              This page is only available to administrators.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Design Kit" showBackButton />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-10 pb-10">
          {/* ═══════════════════════════════════════════════════════════════════
             1. COLOR PALETTE
             ═══════════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeading
              title="Color Palette"
              description='The "Clean Ledger" design system uses sage green as the primary color and warm amber as the accent.'
            />

            {/* Primary & Accent */}
            <h3 className="font-serif text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Brand Colors
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ColorSwatch
                name="Primary (Sage Green)"
                variable="--primary"
                colorClass="bg-primary"
                textClass="text-primary-foreground"
              />
              <ColorSwatch
                name="Primary Foreground"
                variable="--primary-foreground"
                colorClass="bg-primary-foreground border-2"
                textClass="text-primary"
              />
              <ColorSwatch
                name="Accent (Warm Amber)"
                variable="--accent"
                colorClass="bg-accent"
                textClass="text-accent-foreground"
              />
              <ColorSwatch
                name="Accent Foreground"
                variable="--accent-foreground"
                colorClass="bg-accent-foreground border-2"
                textClass="text-accent"
              />
            </div>

            {/* Surfaces */}
            <h3 className="font-serif text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">
              Surfaces
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ColorSwatch
                name="Background"
                variable="--background"
                colorClass="bg-background border-2"
                textClass="text-foreground"
              />
              <ColorSwatch
                name="Foreground"
                variable="--foreground"
                colorClass="bg-foreground"
                textClass="text-background"
              />
              <ColorSwatch
                name="Card"
                variable="--card"
                colorClass="bg-card border-2"
                textClass="text-card-foreground"
              />
              <ColorSwatch
                name="Popover"
                variable="--popover"
                colorClass="bg-popover border-2"
                textClass="text-popover-foreground"
              />
            </div>

            {/* Muted & Secondary */}
            <h3 className="font-serif text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">
              Muted & Secondary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ColorSwatch
                name="Muted"
                variable="--muted"
                colorClass="bg-muted"
                textClass="text-muted-foreground"
              />
              <ColorSwatch
                name="Muted Foreground"
                variable="--muted-foreground"
                colorClass="bg-muted-foreground"
                textClass="text-muted"
              />
              <ColorSwatch
                name="Secondary"
                variable="--secondary"
                colorClass="bg-secondary"
                textClass="text-secondary-foreground"
              />
              <ColorSwatch
                name="Secondary Foreground"
                variable="--secondary-foreground"
                colorClass="bg-secondary-foreground"
                textClass="text-secondary"
              />
            </div>

            {/* Destructive & Borders */}
            <h3 className="font-serif text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">
              Destructive, Borders & Ring
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ColorSwatch
                name="Destructive"
                variable="--destructive"
                colorClass="bg-destructive"
                textClass="text-destructive-foreground"
              />
              <ColorSwatch
                name="Border"
                variable="--border"
                colorClass="bg-border"
              />
              <ColorSwatch
                name="Input"
                variable="--input"
                colorClass="bg-input"
              />
              <ColorSwatch
                name="Ring"
                variable="--ring"
                colorClass="bg-ring"
                textClass="text-primary-foreground"
              />
            </div>

            {/* Chart Colors */}
            <h3 className="font-serif text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">
              Chart Colors
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <ColorSwatch
                  key={n}
                  name={`Chart ${n}`}
                  variable={`--chart-${n}`}
                  colorClass={`bg-chart-${n}`}
                  textClass="text-white"
                />
              ))}
            </div>
          </section>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════════
             2. TYPOGRAPHY
             ═══════════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeading
              title="Typography"
              description="DM Serif Display for headings, Inter for body text."
            />

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <h1 className="font-serif text-3xl font-bold">
                    Heading 1 - DM Serif Display
                  </h1>
                  <h2 className="font-serif text-2xl font-semibold">
                    Heading 2 - DM Serif Display
                  </h2>
                  <h3 className="font-serif text-xl font-semibold">
                    Heading 3 - DM Serif Display
                  </h3>
                  <h4 className="font-serif text-lg font-semibold">
                    Heading 4 - DM Serif Display
                  </h4>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-base">
                    Body text (base) - Inter. The quick brown fox jumps over the
                    lazy dog. This is the default text size used for paragraphs
                    and content.
                  </p>
                  <p className="text-sm">
                    Small text (sm) - Inter. Used for secondary information,
                    labels, and supporting content throughout the interface.
                  </p>
                  <p className="text-xs">
                    Extra small text (xs) - Inter. Used for timestamps, meta
                    information, and fine print.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Muted text - Used for secondary/placeholder content with
                    reduced emphasis.
                  </p>
                  <p className="text-sm font-medium">
                    Medium weight text - Used for labels and semi-emphasized
                    content.
                  </p>
                  <p className="text-sm font-semibold">
                    Semibold text - Used for emphasis within body copy.
                  </p>
                  <p className="text-sm font-mono">
                    Monospace text - Used for code, variables, and technical
                    values.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════════
             3. BUTTONS
             ═══════════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeading
              title="Buttons"
              description="All shadcn/ui button variants and sizes."
            />

            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Variants */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Variants
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                <Separator />

                {/* Sizes */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Sizes
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <Plus />
                    </Button>
                    <Button size="icon-sm">
                      <Plus />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* With Icons */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    With Icons
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button>
                      <Plus /> Add Expense
                    </Button>
                    <Button variant="outline">
                      <Filter /> Filter
                    </Button>
                    <Button variant="destructive">
                      <Trash2 /> Delete
                    </Button>
                    <Button variant="ghost">
                      <Edit3 /> Edit
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* States */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    States
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Disabled</Button>
                    <Button disabled>
                      <Loader2 className="animate-spin" /> Loading...
                    </Button>
                    <Button className="w-full">Full Width Button</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════════
             4. CARDS
             ═══════════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeading
              title="Cards"
              description="Card components as used throughout the app."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Simple Card */}
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <h3 className="font-serif text-lg font-semibold">
                    Simple Card
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Basic card with content, matching the settings page pattern.
                  </p>
                </CardContent>
              </Card>

              {/* Card with Header */}
              <Card>
                <CardHeader>
                  <CardTitle>Card with Header</CardTitle>
                  <CardDescription>
                    Uses CardHeader, CardTitle, and CardDescription components.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Card body content goes here.</p>
                </CardContent>
              </Card>

              {/* Stat Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Monthly Expenses
                      </p>
                      <p className="text-2xl font-semibold font-serif">
                        $12,450.00
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* List Item Card */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-serif text-lg font-semibold">
                    Recent Expenses
                  </h3>
                  {[
                    {
                      emoji: "\uD83D\uDED2",
                      name: "Groceries",
                      amount: "$850.00",
                    },
                    {
                      emoji: "\u26FD",
                      name: "Gas",
                      amount: "$1,200.00",
                    },
                    {
                      emoji: "\uD83C\uDF7D\uFE0F",
                      name: "Dining Out",
                      amount: "$450.00",
                    },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.emoji}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.amount}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════════
             5. FORM ELEMENTS
             ═══════════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeading
              title="Form Elements"
              description="Inputs, selects, labels, and textareas."
            />

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Text Input</Label>
                  <Input placeholder="Enter a value..." />
                </div>

                <div className="space-y-2">
                  <Label>Amount Input</Label>
                  <Input type="number" placeholder="0.00" />
                </div>

                <div className="space-y-2">
                  <Label>Search Input</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search expenses..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select</Label>
                  <Select defaultValue="mxn">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mxn">MXN (Mexican Peso)</SelectItem>
                      <SelectItem value="usd">USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Textarea</Label>
                  <Textarea placeholder="Add a note..." />
                </div>

                <div className="space-y-2">
                  <Label>Disabled Input</Label>
                  <Input disabled value="Cannot edit this" />
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════════
             6. ICONS
             ═══════════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeading
              title="Icons"
              description="Commonly used lucide-react icons across the app."
            />

            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                  {[
                    { Icon: Home, name: "Home" },
                    { Icon: Receipt, name: "Receipt" },
                    { Icon: Plus, name: "Plus" },
                    { Icon: BarChart3, name: "BarChart3" },
                    { Icon: Settings, name: "Settings" },
                    { Icon: CreditCard, name: "CreditCard" },
                    { Icon: RefreshCw, name: "RefreshCw" },
                    { Icon: Target, name: "Target" },
                    { Icon: DollarSign, name: "DollarSign" },
                    { Icon: ArrowDownCircle, name: "ArrowDownCircle" },
                    { Icon: Wallet, name: "Wallet" },
                    { Icon: ChevronLeft, name: "ChevronLeft" },
                    { Icon: ChevronRight, name: "ChevronRight" },
                    { Icon: Search, name: "Search" },
                    { Icon: Filter, name: "Filter" },
                    { Icon: Calendar, name: "Calendar" },
                    { Icon: Trash2, name: "Trash2" },
                    { Icon: Edit3, name: "Edit3" },
                    { Icon: Check, name: "Check" },
                    { Icon: X, name: "X" },
                    { Icon: AlertCircle, name: "AlertCircle" },
                    { Icon: Info, name: "Info" },
                    { Icon: Bell, name: "Bell" },
                    { Icon: Loader2, name: "Loader2" },
                    { Icon: Eye, name: "Eye" },
                    { Icon: EyeOff, name: "EyeOff" },
                    { Icon: Copy, name: "Copy" },
                    { Icon: MoreHorizontal, name: "MoreHorizontal" },
                  ].map(({ Icon, name }) => (
                    <div
                      key={name}
                      className="flex flex-col items-center gap-1.5 py-2"
                    >
                      <Icon size={20} className="text-foreground" />
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════════
             7. BADGES & STATUS
             ═══════════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeading
              title="Badges & Status"
              description="Badge variants for labels, tags, and status indicators."
            />

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Variants
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Usage Examples
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Admin</Badge>
                    <Badge variant="secondary">MXN</Badge>
                    <Badge variant="outline">Pending</Badge>
                    <Badge variant="destructive">Overdue</Badge>
                    <Badge variant="secondary">Groceries</Badge>
                    <Badge variant="secondary">Subscription</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Inline with Text
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Juanes</span>
                    <Badge className="text-[10px]">Admin</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Netflix</span>
                    <Badge variant="secondary" className="text-[10px]">
                      Monthly
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════════
             8. SPACING & LAYOUT
             ═══════════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <SectionHeading
              title="Spacing & Layout"
              description="Visual reference for the spacing scale and common layout patterns."
            />

            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Spacing Scale */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Spacing Scale
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: "1 (0.25rem / 4px)", width: "w-1" },
                      { name: "2 (0.5rem / 8px)", width: "w-2" },
                      { name: "3 (0.75rem / 12px)", width: "w-3" },
                      { name: "4 (1rem / 16px)", width: "w-4" },
                      { name: "6 (1.5rem / 24px)", width: "w-6" },
                      { name: "8 (2rem / 32px)", width: "w-8" },
                      { name: "10 (2.5rem / 40px)", width: "w-10" },
                      { name: "12 (3rem / 48px)", width: "w-12" },
                      { name: "16 (4rem / 64px)", width: "w-16" },
                    ].map((s) => (
                      <div key={s.name} className="flex items-center gap-3">
                        <div
                          className={`h-4 ${s.width} bg-primary rounded-sm shrink-0`}
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {s.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Border Radius */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Border Radius
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { name: "sm", cls: "rounded-sm" },
                      { name: "md", cls: "rounded-md" },
                      { name: "lg", cls: "rounded-lg" },
                      { name: "xl", cls: "rounded-xl" },
                      { name: "full", cls: "rounded-full" },
                    ].map((r) => (
                      <div
                        key={r.name}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className={`h-12 w-12 bg-primary ${r.cls}`}
                        />
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {r.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Common Layout Patterns */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Common Page Layout
                  </p>
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="h-8 bg-muted rounded flex items-center px-3">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Header (h-14, border-b)
                      </span>
                    </div>
                    <div className="border rounded p-3 space-y-2">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        max-w-lg mx-auto p-4 md:p-6 space-y-6
                      </span>
                      <div className="h-16 bg-card border rounded-xl flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Card
                        </span>
                      </div>
                      <div className="h-16 bg-card border rounded-xl flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Card
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-muted rounded flex items-center justify-center md:hidden">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        MobileNav (h-16, fixed bottom)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}

