// Staff Newsletters list: Drafts / Published, create (awaited, no duplicates)
// and delete. Reloads quietly on focus so saves/publishes in the editor show.
import { notifyError } from "@/lib/discord";
import {
  createNewsletter,
  getNewsletters,
  softDeleteNewsletter,
  type NewsletterListItem,
} from "@/lib/newsletters-actions";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Filter = "draft" | "published";
export type Result = { ok: boolean; error?: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Mon–Fri ranges starting this week (next week on weekends). Computed when asked, never at import. */
export function generateWeekOptions(count = 16): string[] {
  const today = new Date();
  const dow = today.getDay();
  const diff = dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diff);
  return Array.from({ length: count }, (_, i) => {
    const m = new Date(mon);
    m.setDate(mon.getDate() + i * 7);
    const f = new Date(m);
    f.setDate(m.getDate() + 4);
    return `${MONTHS[m.getMonth()]} ${m.getDate()} – ${MONTHS[f.getMonth()]} ${f.getDate()}`;
  });
}

export function useStaffNewsletters() {
  const router = useRouter();
  const [items, setItems] = useState<NewsletterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("draft");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const createLock = useRef(false);
  const seq = useRef(0);

  const load = useCallback(async (): Promise<Result> => {
    const my = ++seq.current;
    try {
      const data = await getNewsletters();
      if (my !== seq.current) return { ok: true };
      setItems(data);
      setError(false);
      return { ok: true };
    } catch (e) {
      if (my !== seq.current) return { ok: true };
      notifyError("staff-newsletters-load", e);
      setError(true);
      return { ok: false, error: e instanceof Error ? e.message : "Failed to load newsletters" };
    }
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focused.current) void loadRef.current();
      focused.current = true;
    }, []),
  );

  const create = useCallback(
    async (title: string, weekRange: string): Promise<Result & { id?: string }> => {
      if (createLock.current) return { ok: false, error: "Already creating." };
      createLock.current = true;
      setCreating(true);
      try {
        const nl = await createNewsletter(title, weekRange);
        setItems((prev) => [
          { id: nl.id, title: nl.title, week_range: nl.week_range, status: nl.status, updated_at: nl.updated_at, created_at: nl.created_at },
          ...prev,
        ]);
        setFilter("draft");
        return { ok: true, id: nl.id };
      } catch (e) {
        notifyError("staff-newsletter-create", e);
        return { ok: false, error: e instanceof Error ? e.message : "Failed to create newsletter" };
      } finally {
        createLock.current = false;
        setCreating(false);
      }
    },
    [],
  );

  const remove = useCallback(async (n: NewsletterListItem): Promise<Result> => {
    setDeleting((d) => ({ ...d, [n.id]: true }));
    try {
      await softDeleteNewsletter(n.id);
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      return { ok: true };
    } catch (e) {
      notifyError("staff-newsletter-delete", e);
      return { ok: false, error: e instanceof Error ? e.message : "Failed to delete" };
    } finally {
      setDeleting(({ [n.id]: _, ...rest }) => rest);
    }
  }, []);

  const filtered = useMemo(() => items.filter((n) => n.status === filter), [items, filter]);
  const counts = useMemo(
    () => ({
      draft: items.filter((n) => n.status === "draft").length,
      published: items.filter((n) => n.status === "published").length,
    }),
    [items],
  );

  return {
    items,
    filtered,
    counts,
    filter,
    setFilter,
    loading,
    error,
    reload: load,
    create,
    creating,
    remove,
    deleting,
    open: (id: string) => router.push({ pathname: "/(staff)/newsletters/[newsletterId]" as never, params: { newsletterId: id } }),
  };
}

export type StaffNewsletters = ReturnType<typeof useStaffNewsletters>;
