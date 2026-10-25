"use client";

type Props = {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
};

export default function DiscardChangesDialog({ open, onKeepEditing, onDiscard }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onKeepEditing}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold font-heading text-gray-900">
            Discard unsaved changes?
          </h3>
          <p className="text-sm font-body text-gray-500">
            You have unsaved changes. If you leave now, your changes will be lost.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onKeepEditing}
            className="px-4 py-2 text-sm font-semibold font-body text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="px-4 py-2 text-sm font-semibold font-body text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
          >
            Discard changes
          </button>
        </div>
      </div>
    </div>
  );
}
