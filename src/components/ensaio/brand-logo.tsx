import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  size = "default",
  variant = "full",
}: {
  className?: string;
  size?: "sm" | "default" | "lg" | "xl";
  variant?: "full" | "compact" | "icon";
}) {
  const isCompact = variant === "compact";
  const isIcon = variant === "icon";

  const sizeClasses = {
    sm: "scale-75",
    default: "scale-90 sm:scale-100",
    lg: "scale-105 sm:scale-110",
    xl: "scale-110 sm:scale-125",
  }[size];

  if (isIcon) {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-9 transition-transform hover:scale-105"
        >
          {/* Outer Lens Ring */}
          <circle
            cx="24"
            cy="24"
            r="22"
            className="stroke-foreground/20"
            strokeWidth="1.2"
            strokeDasharray="2 3"
          />
          <circle
            cx="24"
            cy="24"
            r="18"
            className="stroke-foreground/80"
            strokeWidth="1.5"
          />
          {/* Aperture Petals */}
          <path
            d="M24 6L28 16M38 14L32 22M42 28L32 30M34 40L26 34M20 42L22 32M10 34L18 28M6 20L16 20M14 10L22 16"
            className="stroke-foreground/30"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* Center Monogram F + AI Star */}
          <path
            d="M20 16H28M20 23H26M20 16V32"
            className="stroke-foreground"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* AI Sparkle Star */}
          <path
            d="M30 18C30 18 31 16 32 16C33 16 34 18 34 18C34 18 36 19 36 20C36 21 34 22 34 22C34 22 33 24 32 24C31 24 30 22 30 22C30 22 28 21 28 20C28 19 30 18 30 18Z"
            className="fill-amber-400 stroke-amber-500/50"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-7 shrink-0"
        >
          <circle
            cx="24"
            cy="24"
            r="21"
            className="stroke-foreground/30"
            strokeWidth="1.2"
          />
          <circle
            cx="24"
            cy="24"
            r="16"
            className="stroke-foreground"
            strokeWidth="1.4"
          />
          <path
            d="M21 17H27M21 23H25M21 17V31"
            className="stroke-foreground"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M29 19C29 19 30 17.5 31 17.5C32 17.5 33 19 33 19C33 19 34.5 20 34.5 21C34.5 22 33 23 33 23C33 23 32 24.5 31 24.5C30 24.5 29 23 29 23C29 23 27.5 22 27.5 21C27.5 20 29 19 29 19Z"
            className="fill-amber-400"
          />
        </svg>
        <div className="flex flex-col text-left">
          <span className="font-display text-sm tracking-[0.14em] font-medium leading-none text-foreground uppercase">
            Felipe Bueno
          </span>
          <span className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground font-sans mt-0.5">
            Ensaios IA
          </span>
        </div>
      </div>
    );
  }

  // Full Hero Variant
  return (
    <div className={cn("flex flex-col items-center text-center", sizeClasses, className)}>
      {/* Animated Glowing Emblem */}
      <div className="relative mb-4 flex size-20 items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-transparent blur-xl" />

        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative size-20 transition-transform duration-500 hover:scale-105"
        >
          {/* Concentric Lens Grid */}
          <circle
            cx="32"
            cy="32"
            r="30"
            className="stroke-foreground/15"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <circle
            cx="32"
            cy="32"
            r="26"
            className="stroke-foreground/30"
            strokeWidth="1"
          />
          <circle
            cx="32"
            cy="32"
            r="20"
            className="stroke-foreground/90"
            strokeWidth="1.6"
          />

          {/* Precision Crosshairs */}
          <line x1="32" y1="3" x2="32" y2="8" className="stroke-foreground/40" strokeWidth="1.2" />
          <line x1="32" y1="56" x2="32" y2="61" className="stroke-foreground/40" strokeWidth="1.2" />
          <line x1="3" y1="32" x2="8" y2="32" className="stroke-foreground/40" strokeWidth="1.2" />
          <line x1="56" y1="32" x2="61" y2="32" className="stroke-foreground/40" strokeWidth="1.2" />

          {/* Monogram "F" */}
          <path
            d="M27 22H37M27 30H34M27 22V42"
            className="stroke-foreground"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Modern AI Brilliance Sparkle */}
          <path
            d="M40 24C40 24 41.5 21.5 43 21.5C44.5 21.5 46 24 46 24C46 24 48.5 25.5 48.5 27C48.5 28.5 46 30 46 30C46 30 44.5 32.5 43 32.5C41.5 32.5 40 30 40 30C40 30 37.5 28.5 37.5 27C37.5 25.5 40 24 40 24Z"
            className="fill-amber-400 stroke-amber-500/40"
            strokeWidth="0.8"
          />

          {/* Subtle Aperture Blades */}
          <path
            d="M32 12L37 20M48 20L42 29M50 38L40 40M40 50L33 44M24 50L26 40M14 42L22 36M12 26L22 26M18 16L27 22"
            className="stroke-foreground/20"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography */}
      <h2 className="font-display text-2xl sm:text-3xl font-light uppercase tracking-[0.22em] text-foreground">
        Felipe Bueno
      </h2>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-px w-5 bg-border" />
        <span className="text-[0.68rem] sm:text-xs font-sans uppercase tracking-[0.28em] text-muted-foreground font-medium">
          Ensaios Profissionais com IA
        </span>
        <span className="h-px w-5 bg-border" />
      </div>
    </div>
  );
}
