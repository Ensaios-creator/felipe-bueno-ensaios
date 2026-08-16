import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function OptionList({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string; hint?: string }[];
  value: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              "flex w-full items-start justify-between gap-4 rounded-lg border p-4 text-left transition-colors",
              active
                ? "border-foreground bg-secondary"
                : "border-border bg-card hover:border-foreground/40",
            )}
          >
            <span>
              <span className="block font-display text-xl font-light tracking-tight">
                {option.label}
              </span>
              {option.hint ? (
                <span className="mt-1 block text-sm text-muted-foreground">{option.hint}</span>
              ) : null}
            </span>
            {active ? <Check className="mt-1 size-5 shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function VisualGrid({
  items,
  selected,
  onToggle,
  multi,
}: {
  items: { id: string; name: string; code: string; imageUrl: string | null; tags: string[] }[];
  selected: string[];
  onToggle: (id: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item) => {
        const active = selected.includes(item.id);
        const order = selected.indexOf(item.id) + 1;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={cn(
              "group overflow-hidden rounded-lg border text-left transition-all",
              active ? "border-foreground ring-1 ring-foreground" : "border-border",
            )}
          >
            <span className="relative block aspect-[4/5] bg-muted">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center px-3 text-center font-display text-lg font-light text-muted-foreground">
                  {item.name}
                </span>
              )}
              {active ? (
                <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-foreground text-xs text-background">
                  {multi ? order : <Check className="size-4" />}
                </span>
              ) : null}
            </span>
            <span className="block p-3">
              <span className="block font-display text-lg font-light leading-tight">
                {item.name}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
