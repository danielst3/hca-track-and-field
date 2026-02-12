import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileSelect({ 
  value, 
  onValueChange, 
  options, 
  placeholder = "Select...",
  label,
  triggerClassName 
}) {
  const [open, setOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("w-full justify-start text-left font-normal", triggerClassName)}
        >
          {selectedOption?.label || placeholder}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="dark:bg-gray-900 dark:border-gray-700">
        <DrawerHeader>
          <DrawerTitle className="dark:text-gray-100">{label || placeholder}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-2 max-h-[60vh] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-lg border transition-colors",
                value === option.value 
                  ? "bg-[var(--brand-secondary)] dark:bg-gray-800 border-[var(--brand-primary)] dark:border-gray-600" 
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <span className="text-sm font-medium dark:text-gray-200">{option.label}</span>
              {value === option.value && (
                <Check className="w-5 h-5 text-[var(--brand-primary)] dark:text-gray-300" />
              )}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}