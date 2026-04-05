import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function Button({
  disabled,
  onClick,
  children,
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-primary-light hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0`}
    >
      {children}
    </button>
  );
}
