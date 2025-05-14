"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Input, InputProps } from "@/components/ui/input"

export interface NumberInputProps extends Omit<InputProps, 'type'> {
  // Add any additional props specific to NumberInput
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, placeholder, value, onChange, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState<string | number | readonly string[] | undefined>(value);

    // Update internal value when external value changes
    useEffect(() => {
      setInputValue(value);
    }, [value]);

    // Handle focus event
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);

      // Clear the input field when focused if the value is 0 or 1 (default values)
      if (e.target.value === "0" || e.target.value === "1") {
        e.target.value = "";
        // Trigger onChange to update the form state
        const changeEvent = new Event("change", { bubbles: true });
        e.target.dispatchEvent(changeEvent);
        setInputValue("");
      }

      props.onFocus?.(e);
    };

    // Handle blur event
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      // If the field is empty when blurred, set it back to the default value (0)
      if (e.target.value === "") {
        e.target.value = "0";
        // Trigger onChange to update the form state
        const changeEvent = new Event("change", { bubbles: true });
        e.target.dispatchEvent(changeEvent);
        setInputValue("0");
      }

      props.onBlur?.(e);
    };

    // Handle change event
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      onChange?.(e);
    };

    return (
      <Input
        type="number"
        className={className}
        placeholder={isFocused ? "" : placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        value={inputValue}
        ref={ref}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
