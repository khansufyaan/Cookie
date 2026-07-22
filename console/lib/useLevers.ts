"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LEVERS, type Levers } from "./model";

/**
 * The active model, shared across pages: persisted in localStorage so the
 * workbench (/model) and the portfolio dashboard always agree, and loadable
 * from a published-model share link (?model=<id>).
 */
export function useLevers(): {
  levers: Levers;
  setLevers: (l: Levers) => void;
  loadedModel: string | null;
} {
  const [levers, setLeversState] = useState<Levers>({ ...DEFAULT_LEVERS });
  const [loadedModel, setLoadedModel] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("model");
    if (id) {
      fetch(`/api/models/${id}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.data?.levers) {
            const merged = { ...DEFAULT_LEVERS, ...j.data.levers };
            setLeversState(merged);
            localStorage.setItem("vrc-levers", JSON.stringify(merged));
            setLoadedModel(`${j.data.name} v${j.data.version}`);
          }
        })
        .catch(() => {});
      return;
    }
    try {
      const saved = localStorage.getItem("vrc-levers");
      if (saved) setLeversState({ ...DEFAULT_LEVERS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const setLevers = (l: Levers) => {
    setLeversState(l);
    try {
      localStorage.setItem("vrc-levers", JSON.stringify(l));
    } catch {}
  };

  return { levers, setLevers, loadedModel };
}
