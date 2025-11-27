"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      fullWidth = true,
      className = "",
      id,
      options,
      placeholder,
      ...props
    },
    ref
  ) => {
    const selectId =
      id || `select-${label?.toLowerCase().replace(/\s+/g, "-")}`;
    const hasError = !!error;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full px-3 text-black py-2.5 border rounded-lg
              focus:ring-2 focus:ring-slate-500 focus:border-slate-500
              transition-all duration-200
              ${hasError ? "border-red-300 bg-red-50" : "border-gray-300"}
              ${className}
            `}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${selectId}-error`
                : helperText
                ? `${selectId}-helper`
                : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {hasError && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${selectId}-error`}
            className="text-red-600 text-sm mt-1 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="text-gray-500 text-sm mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
