import type { ComponentType, ReactNode } from "react";
import type {
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

interface Props<TFormValues extends FieldValues> {
  id: Path<TFormValues>;
  type: string;
  placeholder?: string;
  name?: string;
  autoComplete?: string;
  ariaLabel?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  spellCheck?: boolean;
  Icon?: ComponentType<{ className?: string }>;
  errors?: { message?: string };
  register: UseFormRegister<TFormValues>;
  children?: ReactNode;
  className?: string;
}

export default function Input<TFormValues extends FieldValues>({
  id,
  type,
  placeholder,
  name,
  autoComplete,
  ariaLabel,
  autoCapitalize,
  spellCheck,
  Icon,
  errors,
  register,
  children,
  className,
}: Props<TFormValues>) {
  return (
    <div className={`${className || ""} mb-4 flex w-full flex-col`}>
      <div className="relative w-full">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="text-gold-dark" />
          </div>
        )}
        <input
          {...register(id)}
          id={id}
          name={name ?? id}
          type={type}
          autoComplete={autoComplete}
          aria-label={ariaLabel ?? placeholder ?? String(id)}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          className={`w-full rounded-lg border bg-surface px-4 py-2 text-text-primary transition-colors placeholder:text-text-secondary focus:outline-none focus:ring-2 ${
            Icon ? "pl-10" : ""
          } ${
            errors
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-border-default focus:border-gold-light focus:ring-gold-light"
          }`}
          placeholder={placeholder}
        />
        {children}
      </div>
      {errors && (
        <span className="ml-1 mt-1 text-sm text-red-500">{errors.message}</span>
      )}
    </div>
  );
}
