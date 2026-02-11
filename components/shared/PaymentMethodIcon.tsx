"use client";

import { CreditCard, Banknote } from "lucide-react";

interface PaymentMethodIconProps {
  method: "card" | "cash" | null;
  size?: number;
  showLabel?: boolean;
}

export function PaymentMethodIcon({ method, size = 14, showLabel = false }: PaymentMethodIconProps) {
  if (!method) return null;

  const Icon = method === "card" ? CreditCard : Banknote;
  const label = method === "card" ? "Card" : "Cash";

  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Icon size={size} />
      {showLabel && <span className="text-xs">{label}</span>}
    </span>
  );
}
