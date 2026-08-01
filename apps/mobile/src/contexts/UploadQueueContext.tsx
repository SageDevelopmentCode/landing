import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
} from "react";
import { Alert } from "react-native";
import { uploadPhoto, PublicationLabel } from "@/lib/photos-actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SharedPayload = {
  caption: string | null;
  taken_on: string | null;
  taggedStudentIds: string[];
  publication_labels: PublicationLabel[];
};

type UploadItem = {
  id: string;
  status: "pending" | "uploading" | "done" | "error";
};

type UploadBatch = {
  items: UploadItem[];
  totalCount: number;
  doneCount: number;
  errorCount: number;
};

type State = { batch: UploadBatch | null };

type Action =
  | { type: "BATCH_START"; items: UploadItem[] }
  | { type: "ITEM_STARTED"; id: string }
  | { type: "ITEM_DONE"; id: string }
  | { type: "ITEM_ERROR"; id: string }
  | { type: "BATCH_CLEAR" };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "BATCH_START":
      return {
        batch: {
          items: action.items,
          totalCount: action.items.length,
          doneCount: 0,
          errorCount: 0,
        },
      };
    case "ITEM_STARTED":
      return {
        batch: state.batch && {
          ...state.batch,
          items: state.batch.items.map((i) =>
            i.id === action.id ? { ...i, status: "uploading" } : i
          ),
        },
      };
    case "ITEM_DONE":
      return {
        batch: state.batch && {
          ...state.batch,
          doneCount: state.batch.doneCount + 1,
          items: state.batch.items.map((i) =>
            i.id === action.id ? { ...i, status: "done" } : i
          ),
        },
      };
    case "ITEM_ERROR":
      return {
        batch: state.batch && {
          ...state.batch,
          errorCount: state.batch.errorCount + 1,
          items: state.batch.items.map((i) =>
            i.id === action.id ? { ...i, status: "error" } : i
          ),
        },
      };
    case "BATCH_CLEAR":
      return { batch: null };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Concurrency helper
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try {
        results[i] = { status: "fulfilled", value: await tasks[i]() };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type UploadQueueContextValue = {
  batch: UploadBatch | null;
  enqueueUpload: (uris: string[], payload: SharedPayload, userId: string) => void;
  onBatchComplete: (cb: () => void) => () => void;
  markGalleryDirty: () => void;
  markGalleryClean: () => void;
  isGalleryDirty: () => boolean;
};

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null);

export function UploadQueueProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { batch: null });
  const completionCallbackRef = useRef<(() => void) | null>(null);
  // Keep a ref so the async tasks can read latest batch state without stale closure
  const batchRef = useRef<UploadBatch | null>(null);
  batchRef.current = state.batch;

  // Gallery dirty flag — starts true so the first load always runs
  const galleryDirtyRef = useRef(true);
  const markGalleryDirty = useCallback(() => { galleryDirtyRef.current = true; }, []);
  const markGalleryClean = useCallback(() => { galleryDirtyRef.current = false; }, []);
  const isGalleryDirty   = useCallback(() => galleryDirtyRef.current, []);

  const enqueueUpload = useCallback(
    (uris: string[], payload: SharedPayload, userId: string) => {
      if (batchRef.current !== null) return;

      const items: UploadItem[] = uris.map((_, i) => ({
        id: String(i),
        status: "pending",
      }));

      dispatch({ type: "BATCH_START", items });

      const tasks = uris.map((uri, i) => async () => {
        dispatch({ type: "ITEM_STARTED", id: String(i) });
        try {
          await uploadPhoto({ localUri: uri, ...payload }, userId);
          dispatch({ type: "ITEM_DONE", id: String(i) });
        } catch (err) {
          dispatch({ type: "ITEM_ERROR", id: String(i) });
          throw err;
        }
      });

      runWithConcurrency(tasks, 4).then((results) => {
        const errorCount = results.filter((r) => r.status === "rejected").length;
        completionCallbackRef.current?.();
        if (errorCount > 0) {
          Alert.alert(
            "Some uploads failed",
            `${errorCount} photo${errorCount !== 1 ? "s" : ""} could not be uploaded. The rest were saved.`
          );
        }
        setTimeout(() => dispatch({ type: "BATCH_CLEAR" }), 1500);
      });
    },
    []
  );

  const onBatchComplete = useCallback((cb: () => void) => {
    completionCallbackRef.current = cb;
    return () => {
      completionCallbackRef.current = null;
    };
  }, []);

  return (
    <UploadQueueContext.Provider value={{ batch: state.batch, enqueueUpload, onBatchComplete, markGalleryDirty, markGalleryClean, isGalleryDirty }}>
      {children}
    </UploadQueueContext.Provider>
  );
}

export function useUploadQueue() {
  const ctx = useContext(UploadQueueContext);
  if (!ctx) throw new Error("useUploadQueue must be used within UploadQueueProvider");
  return ctx;
}
