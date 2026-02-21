import { useMemo } from "react";

export const EMPTY_OPTION_VALUE_BASE = "__settera_empty_option__";

export function useEmptyOptionValue(
  options: { value: string }[],
): string {
  return useMemo(() => {
    if (!options.some((opt) => opt.value === EMPTY_OPTION_VALUE_BASE)) {
      return EMPTY_OPTION_VALUE_BASE;
    }
    let i = 1;
    while (
      options.some((opt) => opt.value === `${EMPTY_OPTION_VALUE_BASE}_${i}`)
    ) {
      i += 1;
    }
    return `${EMPTY_OPTION_VALUE_BASE}_${i}`;
  }, [options]);
}
