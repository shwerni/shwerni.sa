// React & Next
import React from "react";

// icons
import { type LucideIcon } from "lucide-react";

// props
interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
}

// titled group of related fields, separated by a top rule
export function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: Props) {
  return (
    <section className="space-y-6 border-t border-zgrey-50 pt-8 first:border-t-0 first:pt-0">
      <header className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 shrink-0 text-zblue-200" />
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-zblue-200">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
