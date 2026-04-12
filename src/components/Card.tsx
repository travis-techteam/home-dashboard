import { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-card-bg border border-card-border rounded-2xl p-5 ${className}`}
    >
      {title && (
        <h2 className="text-muted text-sm font-semibold uppercase tracking-wider mb-3">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
