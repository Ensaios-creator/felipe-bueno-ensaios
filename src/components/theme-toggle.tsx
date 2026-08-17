import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  variant = "ghost",
  size = "icon",
  showLabel = false,
}: {
  className?: string;
  variant?: "ghost" | "outline" | "secondary";
  size?: "icon" | "sm" | "default";
  showLabel?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn("relative transition-colors", className)}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Alternar tema claro/escuro"
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="size-4 text-foreground/80 transition-transform hover:-rotate-12" />
      )}
      {showLabel ? (
        <span className="ml-2 text-xs font-normal">
          {isDark ? "Modo Claro" : "Modo Escuro"}
        </span>
      ) : null}
    </Button>
  );
}
