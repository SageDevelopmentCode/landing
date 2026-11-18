// Data for the parent Newsletters list: published newsletters, newest first.
import { getPublishedNewsletters, type ParentNewsletterListItem } from "@/lib/newsletters-actions";
import { useCallback, useEffect, useState } from "react";

export type Result = { ok: boolean; error?: string };

export function useParentNewsletters() {
  const [items, setItems] = useState<ParentNewsletterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<Result> => {
    try {
      const data = await getPublishedNewsletters();
      setItems(data);
      setError(null);
      return { ok: true };
    } catch (err: any) {
      const message = err?.message ?? "Failed to load newsletters";
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  return { items, loading, error, reload: load };
}

export type ParentNewsletters = ReturnType<typeof useParentNewsletters>;
