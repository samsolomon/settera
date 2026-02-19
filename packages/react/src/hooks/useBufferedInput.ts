import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Buffer text input locally and commit on blur or Enter. Revert on Escape.
 *
 * Keeps a local copy of the value while the input is focused so that
 * every keystroke doesn't trigger onChange/setValue upstream. The caller
 * provides `onCommit` which is called with the local string value when
 * the user finishes editing.
 *
 * External value changes (e.g. from another source) are synced into the
 * local buffer only while the input is *not* focused.
 */
export function useBufferedInput(
  committedValue: string,
  onCommit: (localValue: string) => void,
) {
  const [localValue, setLocalValue] = useState(committedValue);
  const localRef = useRef(localValue);
  const focusedRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);

  // Sync from external value when not focused
  useEffect(() => {
    if (!focusedRef.current) {
      localRef.current = committedValue;
      setLocalValue(committedValue);
    }
  }, [committedValue]);

  const commit = useCallback(() => {
    onCommit(localRef.current);
  }, [onCommit]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      localRef.current = e.target.value;
      setLocalValue(e.target.value);
    },
    [],
  );

  const handleFocus = useCallback(() => {
    focusedRef.current = true;
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    focusedRef.current = false;
    setIsFocused(false);
    commit();
  }, [commit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commit();
      } else if (e.key === "Escape") {
        localRef.current = committedValue;
        setLocalValue(committedValue);
      }
    },
    [commit, committedValue],
  );

  return {
    localValue,
    isFocused,
    inputProps: {
      value: localValue,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
    },
  };
}
