import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, className = "", id, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-12 px-3 rounded-2px border border-border bg-surface text-ink text-[17px] placeholder:text-ink-muted focus:border-purple ${className}`}
        {...props}
      />
      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}
