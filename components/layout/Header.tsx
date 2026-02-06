"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export function Header({ title, showBackButton }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isSubPage = showBackButton ?? pathname === "/add";

  return (
    <header className="flex-shrink-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        {/* Mobile: Back button or Logo */}
        <div className="flex items-center gap-2 md:hidden">
          {isSubPage ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-2"
              onClick={() => router.back()}
            >
              <ChevronLeft size={20} />
            </Button>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <Wallet size={24} className="text-primary" />
            </Link>
          )}
        </div>

        {/* Page title */}
        {title && (
          <h1 className="font-serif text-lg md:text-xl font-semibold truncate">
            {title}
          </h1>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
