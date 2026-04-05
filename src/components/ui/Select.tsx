import type { ReactNode } from "react";
import type {
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

interface Props<TFormValues extends FieldValues> {
  id: Path<TFormValues>;
  errors?: { message?: string };
  placeholder?: string;
  children: ReactNode;
  register: UseFormRegister<TFormValues>;
}

export default function Select<TFormValues extends FieldValues>({
  id,
  errors,
  placeholder,
  children,
  register,
}: Props<TFormValues>) {
  return (
    <div className="mb-4 flex w-full flex-col">
      <div className="relative w-full">
        <select
          {...register(id)}
          id={id}
          defaultValue=""
          className={`w-full rounded-lg border bg-surface px-4 py-2 text-text-primary transition-colors focus:outline-none focus:ring-2 ${
            errors
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-border-default focus:border-gold-light focus:ring-gold-light"
          }`}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {children}
        </select>
      </div>
      {errors && (
        <span className="ml-1 mt-1 text-sm text-red-500">{errors.message}</span>
      )}
    </div>
  );
}
