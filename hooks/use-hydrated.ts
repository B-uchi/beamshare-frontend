import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** False during SSR and the hydration pass, true afterwards. Lets render read browser-only values safely. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
