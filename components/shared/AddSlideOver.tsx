"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { IncomeForm } from "@/components/forms/IncomeForm";

interface AddSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "expense" | "income";
  onSuccess?: () => void;
}

export function AddSlideOver({
  open,
  onOpenChange,
  defaultTab = "expense",
  onSuccess,
}: AddSlideOverProps) {
  const [activeTab, setActiveTab] = useState<"expense" | "income">(defaultTab);

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Transaction</SheetTitle>
        </SheetHeader>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mt-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 rounded-md",
              activeTab === "expense" && "bg-background shadow-sm"
            )}
            onClick={() => setActiveTab("expense")}
          >
            Expense
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 rounded-md",
              activeTab === "income" && "bg-background shadow-sm"
            )}
            onClick={() => setActiveTab("income")}
          >
            Income
          </Button>
        </div>

        {activeTab === "expense" ? (
          <ExpenseForm isSheet onSuccess={handleSuccess} onCancel={handleCancel} />
        ) : (
          <IncomeForm isSheet onSuccess={handleSuccess} onCancel={handleCancel} />
        )}
      </SheetContent>
    </Sheet>
  );
}
