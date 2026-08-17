import { Check, Info, Lightbulb, Sparkles, ZoomIn } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
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
              "group relative flex w-full items-start justify-between gap-4 rounded-xl border p-4 sm:p-5 text-left transition-all duration-300",
              active
                ? "border-foreground bg-secondary/80 shadow-editorial ring-1 ring-foreground/20 scale-[1.01]"
                : "border-border/80 bg-card/60 hover:bg-card hover:border-foreground/40 hover:shadow-sm",
            )}
          >
            <span className="flex-1 pr-2">
              <span
                className={cn(
                  "block font-display text-xl sm:text-2xl font-light tracking-tight transition-colors",
                  active ? "text-foreground font-normal" : "text-foreground/90 group-hover:text-foreground",
                )}
              >
                {option.label}
              </span>
              {option.hint ? (
                <span className="mt-1.5 block text-xs sm:text-sm leading-relaxed text-muted-foreground font-sans">
                  {option.hint}
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                active
                  ? "border-foreground bg-foreground text-background scale-110"
                  : "border-border text-transparent group-hover:border-foreground/40",
              )}
            >
              <Check className="size-3.5 stroke-[2.5]" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function StudioTip({
  text,
  title = "Dica do Estúdio",
  className,
}: {
  text: string;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mt-6 overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 text-xs sm:text-sm leading-relaxed text-foreground/90 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
          <Sparkles className="size-3.5" />
        </span>
        <div className="flex-1 space-y-1">
          <p className="text-[0.7rem] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
            {title}
          </p>
          <p className="text-muted-foreground leading-normal">{text}</p>
        </div>
      </div>
    </div>
  );
}

export function ImagePreviewModal({
  imageUrl,
  open,
  onClose,
  onSelect,
  isSelected,
}: {
  imageUrl: string | null;
  open: boolean;
  onClose: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
}) {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="relative aspect-[3/4] w-full max-h-[75vh] overflow-hidden bg-black/90 flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Visualização em tamanho real"
            className="size-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-card/90">
          <p className="text-xs text-muted-foreground">Foto de referência em alta definição</p>
          {onSelect ? (
            <button
              type="button"
              onClick={() => {
                onSelect();
                onClose();
              }}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-medium transition-colors",
                isSelected
                  ? "bg-secondary text-foreground border border-border"
                  : "bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              {isSelected ? "Remover da seleção" : "✓ Escolher esta referência"}
            </button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
