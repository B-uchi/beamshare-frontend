"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { getHopClient, useHop } from "@/hooks/use-hop";

/** App-wide wiring: resume after refresh, surface notices as toasts, show progress in the tab title. */
export function HopProvider({ children }: { children: React.ReactNode }) {
  const { feed } = useHop();

  useEffect(() => {
    const client = getHopClient();
    client.resumeIfStored();
    return client.onNotice((n) => {
      const opts = { id: n.id, description: n.description };
      if (n.tone === "success") toast.success(n.title, opts);
      else if (n.tone === "warning") toast.warning(n.title, opts);
      else if (n.tone === "error") toast.error(n.title, opts);
      else toast(n.title, opts);
    });
  }, []);

  useEffect(() => {
    let total = 0;
    let done = 0;
    for (const item of feed) {
      if (item.kind === "file" && (item.status === "sending" || item.status === "receiving")) {
        total += item.size;
        done += item.bytes;
      }
    }
    const base = document.title.replace(/^\d+% · /, "");
    document.title = total > 0 ? `${Math.floor((done / total) * 100)}% · ${base}` : base;
  }, [feed]);

  return children;
}
