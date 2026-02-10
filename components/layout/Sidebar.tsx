"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, BarChart3, Settings, Wallet, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/expenses", icon: Receipt, label: "Expenses" },
  { href: "/statistics", icon: BarChart3, label: "Stats" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/design", icon: Palette, label: "Design Kit" },
];

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from("ft_profiles")
          .select("display_name")
          .eq("id", authUser.id)
          .single();

        setDisplayName(
          profile?.display_name ||
          authUser.email?.split("@")[0] || "User"
        );
      }
    }
    getUser();
  }, [supabase]);

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="border-b">
        <div className="h-14 flex items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Wallet size={24} className="text-primary" />
            <span className="font-serif text-lg md:text-xl font-semibold">Tracker</span>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-lg transition-colors",
            "hover:bg-muted",
            pathname === "/settings" ? "bg-muted" : ""
          )}
        >
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
            {displayName ? displayName[0].toUpperCase() : "..."}
          </div>
          <p className="text-sm font-medium truncate">
            {displayName || "Loading..."}
          </p>
        </Link>
      </div>
    </aside>
  );
}
