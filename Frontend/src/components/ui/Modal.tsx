/**
 * Compat shim — gardé pour les pages legacy (CategoriesPage, ProductForm,
 * StockMovementsPage, UsersPage, RolesPage, VenteDetailModal). À supprimer
 * une fois ces pages refondues à l'étape 3 et migrées vers <Dialog>.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Dialog, DialogContent, DialogTitle } from "./Dialog";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
  children?: ReactNode;
}

const sizeClass: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  footer,
  children,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className={cn("p-0 gap-0", sizeClass[size])}>
        {title && (
          <div className="border-b border-default px-5 py-3">
            <DialogTitle>{title}</DialogTitle>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-default bg-surface-muted/30 px-5 py-3">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
