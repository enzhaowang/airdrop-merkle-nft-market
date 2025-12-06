import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = "", title }: CardProps) {
  return (
    <div className={`bg-wagmi-card border border-wagmi-border rounded-xl p-6 ${className}`}>
      {title && <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>}
      {children}
    </div>
  );
}
