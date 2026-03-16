"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, ArrowRightLeft, Plus, BarChart3, MoreHorizontal,
  RefreshCw, DollarSign, CreditCard, Settings, ArrowDownCircle,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

const bottomNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/balance", icon: ArrowRightLeft, label: "Balance" },
  { href: "#add", icon: Plus, label: "Add", isAction: true },
  { href: "/statistics", icon: BarChart3, label: "Stats" },
  { href: "#more", icon: MoreHorizontal, label: "More", isMore: true },
];

const moreMenuItems = [
  { href: "/subscriptions", icon: RefreshCw, label: "Subscriptions" },
  { href: "/income", icon: DollarSign, label: "Income Sources" },
  { href: "/cards", icon: CreditCard, label: "Cards" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const DEPOSITS_ALLOWED_NAMES = ["juanes", "ivonne"];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [canSeeDeposits, setCanSeeDeposits] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkDepositsAccess() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("ft_profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      const name = (profile?.display_name || "").toLowerCase();
      setCanSeeDeposits(DEPOSITS_ALLOWED_NAMES.some((n) => name.includes(n)));
    }
    checkDepositsAccess();
  }, []);

  // Close add menu when tapping outside
  useEffect(() => {
    if (!addMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [addMenuOpen]);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 border-t border-border/50 z-50 safe-area-bottom">
        <div className="flex justify-around items-end h-16 px-2 pb-2">
          {bottomNavItems.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            // Add button
            if (item.isAction) {
              return (
                <div key={item.href} className="relative" ref={addMenuRef}>
                  {/* Add popup menu */}
                  {addMenuOpen && (
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-background border border-border rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                      <button
                        onClick={() => {
                          setAddMenuOpen(false);
                          router.push("/add");
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <Receipt size={18} className="text-red-500" />
                        Add Expense
                      </button>
                      <div className="border-t border-border" />
                      <button
                        onClick={() => {
                          setAddMenuOpen(false);
                          router.push("/add-income");
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <DollarSign size={18} className="text-emerald-600" />
                        Add Income
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setAddMenuOpen(!addMenuOpen)}
                    className="flex flex-col items-center justify-center relative -mt-7"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl ring-4 ring-background/90">
                      <item.icon size={24} className="text-primary-foreground" />
                    </div>
                  </button>
                </div>
              );
            }

            // More button
            if (item.isMore) {
              const isMoreActive = ["/subscriptions", "/income", "/cards", "/settings", "/deposits"].some(
                (p) => pathname === p || pathname.startsWith(p + "/")
              );
              return (
                <button
                  key={item.href}
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-2 min-w-[56px] transition-colors",
                    isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon size={20} className={cn(isMoreActive && "scale-110")} />
                  <span className={cn("text-[10px] mt-1", isMoreActive && "font-medium")}>{item.label}</span>
                </button>
              );
            }

            // Regular nav items
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-2 min-w-[56px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon size={20} className={cn(isActive && "scale-110")} />
                <span className={cn("text-[10px] mt-1", isActive && "font-medium")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More menu sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <nav className="py-2 space-y-1">
            {moreMenuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              );
            })}
            {canSeeDeposits && (
              <Link
                href="/deposits"
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                  pathname === "/deposits" || pathname.startsWith("/deposits/")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <ArrowDownCircle size={20} />
                Deposits
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
