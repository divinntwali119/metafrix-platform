import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("ui-empty-state", className)}>
      <span className="ui-empty-state-icon" aria-hidden="true">
        {icon}
      </span>
      <h2 className="empty-state-title mt-3 text-sm font-semibold">{title}</h2>
      {description && (
        <p className="empty-state-description mt-1 max-w-lg text-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}