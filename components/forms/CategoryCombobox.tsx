"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { FlatSubcategory } from "@/hooks/useCategories";

interface CategoryComboboxProps {
  subcategories: FlatSubcategory[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

function getLabel(sub: FlatSubcategory) {
  return `${sub.categoryEmoji} ${sub.categoryName} - ${sub.emoji ? `${sub.emoji} ` : ""}${sub.name}`;
}

export function CategoryCombobox({
  subcategories,
  value,
  onValueChange,
  disabled,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = subcategories.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full h-11 md:h-9 justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selected ? getLabel(selected) : "Select a category"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command
          filter={(value, search) => {
            const sub = subcategories.find((s) => s.id === value);
            if (!sub) return 0;
            const label = `${sub.categoryName} ${sub.name}`.toLowerCase();
            const terms = search.toLowerCase().split(/\s+/);
            return terms.every((term) => label.includes(term)) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {subcategories.map((sub) => (
                <CommandItem
                  key={sub.id}
                  value={sub.id}
                  onSelect={(selectedValue) => {
                    onValueChange(selectedValue === value ? "" : selectedValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === sub.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {getLabel(sub)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
