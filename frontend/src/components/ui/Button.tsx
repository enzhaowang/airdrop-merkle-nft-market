import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = "primary", 
  fullWidth = false,
  className = "",
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-wagmi-bg disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2";
  
  const variants = {
    primary: "bg-wagmi-primary hover:bg-wagmi-primary-hover text-white focus:ring-wagmi-primary",
    secondary: "bg-wagmi-card hover:bg-wagmi-border text-white border border-wagmi-border focus:ring-wagmi-border",
    outline: "border border-wagmi-border hover:bg-wagmi-border text-wagmi-text-muted hover:text-white focus:ring-wagmi-border"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
