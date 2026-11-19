// Data lifecycle for one read-only form detail screen.
// - First load for a key shows the skeleton.
// - Returning to the screen reloads quietly (no skeleton, data stays put).
// - Pull to refresh / Retry call reload() and get { ok } back; the Garden
//   feedback hook decides what to show.
// - Errors are reported with notifyError and surfaced as friendly copy; the
//   raw message is never shown to parents.
import { notifyError } from "@/lib/discord";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { MissingParamsError, type Result } from "./formsUtils";

export type FormDetailError = "load" | "missing" | null;

export type FormDetail<T> = {
  data: T | null;
  loading: boolean;
  error: FormDetailError;
  reload: () => Promise<Result>;
};

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === "object" && "message" in err) {
    return new Error(String((err as { message: unknown }).message));
  }
  return new Error(String(err));
}

/**
 * @param key   Identity of what is being shown (e.g. `${parentId}:${studentId}`).
 *              Pass null when a required route param is missing.
 * @param loader Fetches everything the screen needs; throws on any error.
 * @param tag   notifyError area tag.
 */
export function useFormDetail<T>(
  key: string | null,
  loader: () => Promise<T>,
  tag: string,
): FormDetail<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<FormDetailError>(null);
  /** Key whose first load has finished (success or failure). */
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);

  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });
  const seqRef = useRef(0);
  const resolvedRef = useRef<string | null>(null);

  const run = useCallback(
    async (mode: "initial" | "quiet"): Promise<Result> => {
      if (key === null) return { ok: false, error: "missing" };
      const my = ++seqRef.current;
      try {
        const next = await loaderRef.current();
        if (my !== seqRef.current) return { ok: true };
        setData(next);
        setError(null);
        resolvedRef.current = key;
        setResolvedKey(key);
        return { ok: true };
      } catch (err) {
        if (my !== seqRef.current) return { ok: false };
        if (err instanceof MissingParamsError) {
          setError("missing");
        } else {
          void notifyError(tag, toError(err));
          // A quiet refocus that fails keeps what's on screen.
          if (mode === "initial") setError("load");
        }
        resolvedRef.current = key;
        setResolvedKey(key);
        return { ok: false, error: toError(err).message };
      }
    },
    [key, tag],
  );

  useFocusEffect(
    useCallback(() => {
      if (key === null) return;
      if (resolvedRef.current !== key) {
        setData(null);
        setError(null);
        void run("initial");
      } else {
        void run("quiet");
      }
    }, [key, run]),
  );

  const reload = useCallback(async () => {
    const r = await run("quiet");
    return r;
  }, [run]);

  if (key === null) {
    return { data: null, loading: false, error: "missing", reload };
  }

  return {
    data,
    loading: resolvedKey !== key,
    error,
    reload,
  };
}
