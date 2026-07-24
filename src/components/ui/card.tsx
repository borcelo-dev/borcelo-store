import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: Props) {
  return (
    <div className={`bg-surface rounded-2px border border-border p-4 ${className}`}>
      {children}
    </div>
  );
}
