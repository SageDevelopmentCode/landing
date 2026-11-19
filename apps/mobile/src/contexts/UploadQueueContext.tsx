// Staff photo upload queue. Mounted by app/(staff)/photos/_layout.tsx (inside
// the staff GardenToastProvider) so uploads keep running while a teacher moves
// around the app. One batch at a time; every item keeps its uri so the ones
// that fail can be retried with the same caption / date / tags / labels.
import { useToast } from "@/components/garden";
import { notifyError } from "@/lib/discord";
import { notifyPhotoBatchFeedPost } from "@/lib/feed-auto-actions";
import { uploadPhoto, type PublicationLabel } from "@/lib/photos-actions";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SharedPayload = {
  caption: string | null;
  taken_on: string | null;
  taggedStudentIds: string[];
  publication_labels: PublicationLabel[];
};

export type UploadItemStatus = "pending" | "uploading" | "done" | "error";

export type UploadItem = {
  id: string;
  uri: string;
  status: UploadItemStatus;
};

export type UploadBatch = {
  items: UploadItem[];
  totalCount: number;
  doneCount: number;
  errorCount: number;
  /** All items have finished (success or failure). */
  finished: boolean;
};

/** What a Retry needs after the batch has been cleared. */
type FailedRun = { uris: string[]; payload: SharedPayload; userId: string };

type State = { batch: UploadBatch | null; failed: FailedRun | null };

type Action =
  | { type: "BATCH_START"; items: UploadItem[] }
  | { type: "ITEM_STARTED"; id: string }
  | { type: "ITEM_DONE"; id: string }
  | { type: "ITEM_ERROR"; id: string }
  | { type: "BATCH_FINISHED"; failed: FailedRun | null }
  | { type: "BATCH_CLEAR" }
  | { type: "FAILED_CLEAR" };

function setItem(batch: UploadBatch, id: string, status: UploadItemStatus): UploadItem[] {
  return batch.items.map((i) => (i.id === id ? { ...i, status } : i));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "BATCH_START":
      return {
        failed: null,
        batch: { items: action.items, totalCount: action.items.length, doneCount: 0, errorCount: 0, finished: false },
      };
    case "ITEM_STARTED":
      return state.batch ? { ...state, batch: { ...state.batch, items: setItem(state.batch, action.id, "uploading") } } : state;
    case "ITEM_DONE":
      return state.batch
        ? {
            ...state,
            batch: {
              ...state.batch,
              doneCount: state.batch.doneCount + 1,
              items: setItem(state.batch, action.id, "done"),
            },
          }
        : state;
    case "ITEM_ERROR":
      return state.batch
        ? {
            ...state,
            batch: {
              ...state.batch,
              errorCount: state.batch.errorCount + 1,
              items: setItem(state.batch, action.id, "error"),
            },
          }
        : state;
    case "BATCH_FINISHED":
      return { failed: action.failed, batch: state.batch && { ...state.batch, finished: true } };
    case "BATCH_CLEAR":
      return { ...state, batch: null };
    case "FAILED_CLEAR":
      return { ...state, failed: null };
    default:
      return state;
  }
}

async function runWithConcurrency(tasks: (() => Promise<void>)[], limit: number) {
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try {
        await tasks[i]();
      } catch {
        // Each task records its own failure.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export type UploadQueueValue = {
  batch: UploadBatch | null;
  /** Photos from the last batch that didn't upload (until retried or dismissed). */
  failedCount: number;
  /** Starts a batch. Returns false when one is already running. */
  enqueueUpload: (uris: string[], payload: SharedPayload, userId: string) => boolean;
  retryFailed: () => boolean;
  dismissFailed: () => void;
  onBatchComplete: (cb: () => void) => () => void;
  markGalleryDirty: () => void;
  markGalleryClean: () => void;
  isGalleryDirty: () => boolean;
};

const UploadQueueContext = createContext<UploadQueueValue | null>(null);

let batchSeq = 0;

export function UploadQueueProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [state, dispatch] = useReducer(reducer, { batch: null, failed: null });
  const subscribers = useRef(new Set<() => void>());
  const runningRef = useRef(false);
  const failedRef = useRef<FailedRun | null>(null);
  const retryRef = useRef<(() => boolean) | null>(null);
  useEffect(() => {
    failedRef.current = state.failed;
  }, [state.failed]);

  // Gallery dirty flag — starts true so the first load always runs.
  const galleryDirtyRef = useRef(true);
  const markGalleryDirty = useCallback(() => {
    galleryDirtyRef.current = true;
  }, []);
  const markGalleryClean = useCallback(() => {
    galleryDirtyRef.current = false;
  }, []);
  const isGalleryDirty = useCallback(() => galleryDirtyRef.current, []);

  const enqueueUpload = useCallback(
    (uris: string[], payload: SharedPayload, userId: string) => {
      if (runningRef.current || uris.length === 0) return false;
      runningRef.current = true;
      const seq = ++batchSeq;
      const items: UploadItem[] = uris.map((uri, i) => ({ id: `${seq}-${i}`, uri, status: "pending" }));
      dispatch({ type: "BATCH_START", items });

      const uploadedIds: string[] = [];
      const failedUris: string[] = [];
      const tasks = items.map((item) => async () => {
        dispatch({ type: "ITEM_STARTED", id: item.id });
        try {
          const photo = await uploadPhoto({ localUri: item.uri, ...payload }, userId);
          uploadedIds.push(photo.id);
          dispatch({ type: "ITEM_DONE", id: item.id });
        } catch (err) {
          notifyError("staff-photo-upload", err);
          failedUris.push(item.uri);
          dispatch({ type: "ITEM_ERROR", id: item.id });
        }
      });

      void runWithConcurrency(tasks, 4).then(async () => {
        if (uploadedIds.length > 0) {
          galleryDirtyRef.current = true;
          try {
            await notifyPhotoBatchFeedPost(uploadedIds, payload.caption);
          } catch (e) {
            notifyError("staff-photo-batch-feed-post", e);
          }
        }
        const failed = failedUris.length ? { uris: failedUris, payload, userId } : null;
        dispatch({ type: "BATCH_FINISHED", failed });
        runningRef.current = false;
        subscribers.current.forEach((cb) => cb());

        const n = uploadedIds.length;
        if (!failed) {
          toast.show({
            tone: "success",
            title: `${n} ${n === 1 ? "photo" : "photos"} uploaded`,
            message: "They're in the gallery now.",
          });
        } else {
          const f = failed.uris.length;
          toast.show({
            tone: "error",
            title: `${f} photo${f !== 1 ? "s" : ""} could not be uploaded`,
            message: n > 0 ? "The rest were saved." : "Check your connection and try again.",
            duration: 7000,
            action: { label: "Retry", onPress: () => void retryRef.current?.() },
          });
        }
        setTimeout(() => dispatch({ type: "BATCH_CLEAR" }), 1800);
      });
      return true;
    },
    [toast],
  );

  const retryFailed = useCallback(() => {
    const f = failedRef.current;
    if (!f) return false;
    return enqueueUpload(f.uris, f.payload, f.userId);
  }, [enqueueUpload]);

  useEffect(() => {
    retryRef.current = retryFailed;
  }, [retryFailed]);

  const dismissFailed = useCallback(() => dispatch({ type: "FAILED_CLEAR" }), []);

  const onBatchComplete = useCallback((cb: () => void) => {
    subscribers.current.add(cb);
    return () => {
      subscribers.current.delete(cb);
    };
  }, []);

  const value = useMemo<UploadQueueValue>(
    () => ({
      batch: state.batch,
      failedCount: state.failed?.uris.length ?? 0,
      enqueueUpload,
      retryFailed,
      dismissFailed,
      onBatchComplete,
      markGalleryDirty,
      markGalleryClean,
      isGalleryDirty,
    }),
    [state.batch, state.failed, enqueueUpload, retryFailed, dismissFailed, onBatchComplete, markGalleryDirty, markGalleryClean, isGalleryDirty],
  );

  return <UploadQueueContext.Provider value={value}>{children}</UploadQueueContext.Provider>;
}

export function useUploadQueue() {
  const ctx = useContext(UploadQueueContext);
  if (!ctx) throw new Error("useUploadQueue must be used within UploadQueueProvider");
  return ctx;
}
