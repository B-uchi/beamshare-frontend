"use client";

import { useSyncExternalStore } from "react";
import { getHopClient, type HopState } from "@/lib/hop/client";

const SERVER_STATE: HopState = {
  connection: "idle",
  phase: "idle",
  room: null,
  selfId: null,
  links: {},
  feed: [],
  ended: null,
  settings: { autoAccept: true },
};

const noopSubscribe = () => () => {};

export function useHop(): HopState {
  const client = typeof window === "undefined" ? null : getHopClient();
  return useSyncExternalStore(
    client?.subscribe ?? noopSubscribe,
    client?.getSnapshot ?? (() => SERVER_STATE),
    () => SERVER_STATE
  );
}

export { getHopClient };
