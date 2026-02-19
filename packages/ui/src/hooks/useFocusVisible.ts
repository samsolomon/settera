import React, { useCallback, useRef, useState } from "react";

/**
 * Track keyboard-driven focus for a visible focus ring.
 *
 * onPointerDown fires before onFocus for mouse/touch clicks, so we use a ref
 * to reliably distinguish pointer focus from keyboard focus. The focus ring
 * only appears for keyboard navigation.
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const pointerDownRef = useRef(false);

  const onPointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const onFocus = useCallback((_e?: React.FocusEvent) => {
    setIsFocusVisible(!pointerDownRef.current);
    pointerDownRef.current = false;
  }, []);

  const onBlur = useCallback((_e?: React.FocusEvent) => {
    setIsFocusVisible(false);
  }, []);

  return {
    isFocusVisible,
    focusVisibleProps: { onPointerDown, onFocus, onBlur },
  };
}
