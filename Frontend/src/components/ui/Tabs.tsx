import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-0.5 border-b border-default",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-sm font-medium text-muted",
        "transition-colors",
        "hover:text-primary",
        "focus-visible:outline-none focus-visible:text-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-primary",
        "after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-accent after:opacity-0 data-[state=active]:after:opacity-100 after:transition-opacity",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  );
}
