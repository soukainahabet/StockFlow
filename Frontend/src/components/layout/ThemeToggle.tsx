import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Tooltip content={isDark ? "Passer en clair" : "Passer en sombre"}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggle}
        aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      >
        {isDark ? (
          <Sun className="h-4 w-4" strokeWidth={2} />
        ) : (
          <Moon className="h-4 w-4" strokeWidth={2} />
        )}
      </Button>
    </Tooltip>
  );
}
