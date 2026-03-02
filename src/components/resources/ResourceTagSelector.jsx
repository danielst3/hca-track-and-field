import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_TAGS = [
  { group: "Event", tags: ["Shot Put", "Discus", "Javelin", "All Events"] },
  { group: "Skill Level", tags: ["Beginner", "Intermediate", "Advanced"] },
  { group: "Type", tags: ["Drill", "Video", "Document", "Reference", "Safety"] },
  { group: "Phase", tags: ["Warm-Up", "Technical", "Strength", "Prehab", "Competition"] },
];

export default function ResourceTagSelector({ value = [], onChange }) {
  const [custom, setCustom] = useState("");

  const toggle = (tag) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  const addCustom = (e) => {
    if (e.key === "Enter" && custom.trim()) {
      e.preventDefault();
      const tag = custom.trim();
      if (!value.includes(tag)) onChange([...value, tag]);
      setCustom("");
    }
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  return (
    <div className="space-y-3">
      <Label className="dark:text-gray-200">Tags</Label>

      {PRESET_TAGS.map(({ group, tags }) => (
        <div key={group}>
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1">{group}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  value.includes(tag)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-900 text-slate-600 dark:text-gray-300 border-slate-300 dark:border-gray-600 hover:border-blue-400"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1">Custom Tag</p>
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={addCustom}
          placeholder="Type and press Enter..."
          className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 text-sm"
        />
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button onClick={() => remove(tag)} className="hover:text-red-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}