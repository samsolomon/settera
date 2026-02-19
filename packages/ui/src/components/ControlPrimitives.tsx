import React from "react";
import { PrimitiveButton, PrimitiveInput } from "./SetteraPrimitives.js";

interface ControlInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError: boolean;
  isDangerous: boolean;
  isFocusVisible: boolean;
}

export const ControlInput = React.forwardRef<
  HTMLInputElement,
  ControlInputProps
>(function ControlInput(
  { hasError, isDangerous, isFocusVisible, style, ...props },
  ref,
) {
  return (
    <PrimitiveInput
      {...props}
      ref={ref}
      tone={isDangerous ? "destructive" : "default"}
      invalid={hasError}
      focusVisible={isFocusVisible}
      style={{
        ...style,
      }}
    />
  );
});

interface ControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isDangerous: boolean;
  isFocusVisible: boolean;
}

export const ControlButton = React.forwardRef<
  HTMLButtonElement,
  ControlButtonProps
>(function ControlButton(
  { isDangerous, isFocusVisible, style, ...props },
  ref,
) {
  return (
    <PrimitiveButton
      {...props}
      ref={ref}
      tone={isDangerous ? "destructive" : "default"}
      focusVisible={isFocusVisible}
      style={{
        ...style,
      }}
    />
  );
});
