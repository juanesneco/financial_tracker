"use client";

interface BlurredAmountProps {
  children: React.ReactNode;
  revealed: boolean;
  onToggle: () => void;
}

export function BlurredAmount({ children, revealed, onToggle }: BlurredAmountProps) {
  return (
    <span
      onClick={onToggle}
      className="cursor-pointer select-none transition-[filter] duration-300"
      style={{ filter: revealed ? "blur(0px)" : "blur(8px)" }}
    >
      {children}
    </span>
  );
}
