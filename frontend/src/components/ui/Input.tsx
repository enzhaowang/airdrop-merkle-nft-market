import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-wagmi-text-muted mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-wagmi-bg border border-wagmi-border rounded-lg px-3 py-2 text-white placeholder-wagmi-text-muted focus:outline-none focus:ring-2 focus:ring-wagmi-primary focus:border-transparent transition-all ${
          error ? "border-red-500 focus:ring-red-500" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
