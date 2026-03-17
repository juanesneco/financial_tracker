"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
          <SheetTitle>
            {defaultTab === "expense" ? "Add Expense" : "Add Income"}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 md:px-6 mt-4">
          {defaultTab === "expense" ? (
            <ExpenseForm isSheet onSuccess={handleSuccess} onCancel={handleCancel} />
          ) : (
            <IncomeForm isSheet onSuccess={handleSuccess} onCancel={handleCancel} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
