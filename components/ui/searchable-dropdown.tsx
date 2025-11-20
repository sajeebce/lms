"use client";

import * as React from "react";
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

export interface SearchableDropdownOption {
  value: string;
  label: string;
  description?: string;
  depth?: number;
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Select item...",
  disabled = false,
  className,
  emptyMessage = "No results found.",
}: SearchableDropdownProps) {
  const [open, setOpen] = React.useState(false);

  // Find selected option
  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal overflow-hidden",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate block overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between cursor-pointer gap-2"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span
                        className="break-words"
                        style={
                          option.depth
                            ? { paddingLeft: option.depth * 12 }
                            : undefined
                        }
                      >
                        {option.label}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="ml-2 h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
