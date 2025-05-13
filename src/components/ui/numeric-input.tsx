"use client"

import * as React from "react"
import { Input, InputProps } from "./input"
import { cn } from "@/lib/utils"

export interface NumericInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  onChange?: (value: number | null) => void;
  onValueChange?: (value: number | null) => void;
  value?: number | null;
  defaultPlaceholder?: string;
  prefix?: string;
  allowNegative?: boolean;
  decimalPlaces?: number;
  min?: number;
  max?: number;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({
    className,
    onChange,
    onValueChange,
    value,
    defaultPlaceholder = "0",
    prefix,
    allowNegative = false,
    decimalPlaces = 2, // Default to 2 decimal places for currency
    min,
    max,
    ...props
  }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState<string>("");

    // Format number to string with proper decimal places
    const formatNumber = (num: number | null | undefined): string => {
      if (num === null || num === undefined || isNaN(Number(num))) {
        return "";
      }
      return Number(num).toFixed(decimalPlaces);
    };

    // Update internal value when external value changes
    React.useEffect(() => {
      if (!isFocused) {
        setInternalValue(formatNumber(value));
      }
    }, [value, decimalPlaces, isFocused]);

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Allow empty input
      if (input === "") {
        setInternalValue("");
        if (onChange) onChange(null);
        if (onValueChange) onValueChange(null);
        return;
      }

      // Allow just a decimal point (treat as "0.")
      if (input === ".") {
        setInternalValue("0.");
        if (onChange) onChange(0);
        if (onValueChange) onValueChange(0);
        return;
      }

      // Validate input format - only allow numbers and one decimal point
      const regex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
      if (!regex.test(input)) {
        return; // Invalid character - reject change
      }

      // Check decimal places
      const parts = input.split('.');
      if (parts.length > 1 && parts[1].length > decimalPlaces) {
        return; // Too many decimal places - reject change
      }

      // Update internal value
      setInternalValue(input);

      // Convert to number for form state
      let numValue: number | null;

      // Handle partial inputs (ending with decimal point)
      if (input.endsWith('.')) {
        // For partial inputs like "5.", use the integer part for the numeric value
        numValue = parseFloat(input.replace(/\.$/, ''));
      } else {
        numValue = parseFloat(input);
      }

      if (!isNaN(numValue)) {
        // Apply min/max constraints
        if (min !== undefined && numValue < min) numValue = min;
        if (max !== undefined && numValue > max) numValue = max;

        // Update form state
        if (onChange) onChange(numValue);
        if (onValueChange) onValueChange(numValue);
      }
    };

    // Handle focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);

      // If value is 0, clear the input for easier entry
      if (value === 0 && internalValue === "0.00") {
        setInternalValue("");
      }

      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    // Handle blur (when input loses focus)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      // Handle empty input
      if (!internalValue) {
        const numValue = 0;
        setInternalValue(formatNumber(numValue));

        if (onChange) onChange(numValue);
        if (onValueChange) onValueChange(numValue);
      }
      // Handle input ending with decimal point
      else if (internalValue.endsWith('.')) {
        const numValue = parseFloat(internalValue);
        setInternalValue(formatNumber(numValue));

        if (onChange) onChange(numValue);
        if (onValueChange) onValueChange(numValue);
      }
      // Format the number with proper decimal places
      else {
        const numValue = parseFloat(internalValue);
        if (!isNaN(numValue)) {
          setInternalValue(formatNumber(numValue));

          if (onChange) onChange(numValue);
          if (onValueChange) onValueChange(numValue);
        }
      }

      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    return (
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-muted-foreground">{prefix}</span>
          </div>
        )}
        <Input
          type="text"
          inputMode="decimal"
          ref={ref}
          className={cn(
            prefix && "pl-10",
            className
          )}
          value={internalValue}
          placeholder={defaultPlaceholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </div>
    )
  }
)

NumericInput.displayName = "NumericInput"

export { NumericInput }
