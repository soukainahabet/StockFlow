import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-full bg-secondary-100 p-3 mb-4">
        <Icon className="text-secondary-500" size={28} />
      </div>
      <h3 className="text-base font-semibold text-secondary-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-secondary-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
