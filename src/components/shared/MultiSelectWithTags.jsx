import React, { useState, useEffect } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

function OptionList({ options, selected, onToggle }) {
  return (
    <div className="space-y-1 p-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left",
              isSelected
                ? "bg-slate-100 dark:bg-gray-700 font-medium"
                : "hover:bg-slate-50 dark:hover:bg-gray-800"
            )}
          >
            <span>{opt.label}</span>
            {isSelected && <Check className="w-4 h-4 text-slate-700 dark:text-gray-300 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

export default function MultiSelectWithTags({ options = [], selected = [], onChange, placeholder = "Select..." }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggle = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  const removeTag = (e, value) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const trigger = (
    <div className="flex flex-wrap items-center gap-1.5 min-h-9 px-3 py-1.5 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-accent transition-colors dark:bg-gray-800 dark:border-gray-700">
      {selected.length === 0 ? (
        <span className="text-muted-foreground">{placeholder}</span>
      ) : (
        selected.map((val) => {
          const opt = options.find((o) => o.value === val);
          return (
            <Badge
              key={val}
              variant="secondary"
              className="flex items-center gap-1 pr-1 dark:bg-gray-600 dark:text-gray-100"
            >
              {opt?.label ?? val}
              <button
                onMouseDown={(e) => removeTag(e, val)}
                className="ml-0.5 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          );
        })
      )}
      <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <div>{trigger}</div>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{placeholder}</DrawerTitle>
          </DrawerHeader>
          <OptionList options={options} selected={selected} onToggle={(v) => { toggle(v); }} />
          <div className="p-3">
            <Button className="w-full" onClick={() => setOpen(false)}>Done</Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div>{trigger}</div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 dark:bg-gray-900 dark:border-gray-700" align="start">
        <OptionList options={options} selected={selected} onToggle={toggle} />
      </PopoverContent>
    </Popover>
  );
}