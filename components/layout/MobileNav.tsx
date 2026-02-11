"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Plus, BarChart3, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/expenses", icon: Receipt, label: "Expenses" },
  { href: "/add", icon: Plus, label: "Add", isAction: true },
  { href: "/statistics", icon: BarChart3, label: "Stats" },
  { href: "/settings", icon: MoreHorizontal, label: "More" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t z-50 safe-area-bottom">
      <div className="flex justify-around items-end h-16 px-2 pb-2">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center relative -mt-7"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg ring-4 ring-card">
                  <item.icon size={24} className="text-primary-foreground" />
                </div>
              </Link>
            );
          }

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
  );
}
