import { Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "./Breadcrumb";
import { SearchPalette } from "./SearchPalette";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-default bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70 px-3 sm:px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMenuClick}
        className="lg:hidden -ml-1"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="min-w-0 flex-1">
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-1.5">
        <SearchPalette />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
