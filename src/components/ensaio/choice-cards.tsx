import { Check, Info, Lightbulb, Sparkles, ZoomIn } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function OptionList({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string; hint?: string; icon?: React.ReactNode | string; badge?: string }[];
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
              "group relative flex w-full items-center justify-between gap-3.5 sm:gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all duration-300 active:scale-[0.99]",
              active
                ? "border-foreground bg-secondary/90 shadow-editorial ring-1 ring-foreground/25 scale-[1.01]"
                : "border-border/80 bg-card/60 hover:bg-card hover:border-foreground/40 hover:shadow-sm",
            )}
          >
            {/* Ícone ou Emoji com container estilizado */}
            {option.icon ? (
              <div
                className={cn(
                  "flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl border text-xl sm:text-2xl transition-transform duration-300",
                  active
                    ? "border-foreground/30 bg-background shadow-sm scale-105"
                    : "border-border/60 bg-secondary/50 group-hover:scale-105",
                )}
              >
                {typeof option.icon === "string" ? (
                  <span className="select-none">{option.icon}</span>
                ) : (
                  option.icon
                )}
              </div>
            ) : null}

            <span className="flex-1 pr-2">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "block font-display text-xl sm:text-2xl font-light tracking-tight transition-colors",
                    active ? "text-foreground font-normal" : "text-foreground/90 group-hover:text-foreground",
                  )}
                >
                  {option.label}
                </span>
                {option.badge ? (
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {option.badge}
                  </span>
                ) : null}
              </span>
              {option.hint ? (
                <span className="mt-1 block text-xs sm:text-sm leading-relaxed text-muted-foreground font-sans">
                  {option.hint}
                </span>
              ) : null}
            </span>

            {/* Checkmark animado */}
            <span
              className={cn(
                "mt-0.5 flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                active
                  ? "border-foreground bg-foreground text-background scale-110 shadow-sm"
                  : "border-border text-transparent group-hover:border-foreground/40",
              )}
            >
              <Check className="size-3.5 sm:size-4 stroke-[2.5]" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ReferencePhotoPicker({
  references,
  selectedId,
  selectedIds = [],
  onSelect,
  multi = false,
  badgeText = "Copiar desta foto",
  onPreview,
}: {
  references: { id: string; imageUrl: string | null; isCustom?: boolean | undefined; name?: string | undefined }[];
  selectedId?: string | null | undefined;
  selectedIds?: string[] | undefined;
  onSelect: (id: string) => void;
  multi?: boolean | undefined;
  badgeText?: string | undefined;
  onPreview?: ((url: string) => void) | undefined;
}) {
  if (references.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
      {references.map((img, idx) => {
        const isSelected = multi ? selectedIds.includes(img.id) : selectedId === img.id;
        const selectionIndex = multi ? selectedIds.indexOf(img.id) + 1 : idx + 1;

        return (
          <button
            key={img.id}
            type="button"
            onClick={() => onSelect(img.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl aspect-[3/4] border transition-all duration-300 text-left cursor-pointer select-none",
              isSelected
                ? "border-foreground ring-2 ring-foreground/90 ring-offset-2 ring-offset-background scale-[1.02] shadow-editorial"
                : "border-border/80 bg-card/60 opacity-80 hover:opacity-100 hover:border-foreground/40 hover:shadow-sm",
            )}
          >
            {img.imageUrl ? (
              <img
                src={img.imageUrl}
                alt={`Referência ${idx + 1}`}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                <span className="text-xs">Sem foto</span>
              </div>
            )}

            {/* Número / Selo da Foto */}
            <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[0.65rem] font-medium text-white backdrop-blur-sm shadow">
              {img.isCustom ? `Sua foto #${idx + 1}` : `Foto #${idx + 1}`}
            </div>

            {/* Botão de Zoom */}
            {img.imageUrl && onPreview ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(img.imageUrl!);
                }}
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                title="Ver em tamanho real"
              >
                <ZoomIn className="size-3.5" />
              </span>
            ) : null}

            {/* Banner Inferior com Badge de Seleção */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 text-white transition-opacity",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <p className="text-xs font-medium flex items-center gap-1.5 leading-tight">
                {isSelected ? (
                  <>
                    <Check className="size-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{badgeText}</span>
                    {multi && (
                      <span className="ml-auto flex size-4.5 items-center justify-center rounded-full bg-foreground text-[0.6rem] font-bold text-background">
                        {selectionIndex}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-white/80">Toque para escolher</span>
                )}
              </p>
            </div>
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
