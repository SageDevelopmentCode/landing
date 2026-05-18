"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShoppingCart,
  CheckCircle,
  Plus,
  ArrowUpFromLine,
  PackagePlus,
  Camera,
  StickyNote,
  RefreshCw,
} from "lucide-react";
import {
  MOCK_INVENTORY_ITEMS,
  ALL_CATEGORIES,
  STATUS_CONFIG,
  SHOPPING_STATUS_CONFIG,
  HISTORY_ACTION_LABELS,
  type InventoryItem,
  type InventoryPhoto,
  type InventoryCategory,
  type InventoryStatus,
  type HistoryActionType,
  type ShoppingRequest,
  type HistoryEvent,
} from "./inventoryData";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function HistoryIcon({ type }: { type: HistoryActionType }) {
  const cls = "w-3 h-3";
  switch (type) {
    case "taken":              return <ArrowUpFromLine className={cls} />;
    case "restocked":          return <PackagePlus className={cls} />;
    case "photo_added":        return <Camera className={cls} />;
    case "note_added":         return <StickyNote className={cls} />;
    case "status_changed":     return <RefreshCw className={cls} />;
    case "shopping_requested": return <ShoppingCart className={cls} />;
    case "created":            return <Plus className={cls} />;
  }
}

const HISTORY_DOT_COLORS: Record<HistoryActionType, string> = {
  taken:              "bg-amber-100 text-amber-600",
  restocked:          "bg-green-100 text-green-600",
  photo_added:        "bg-blue-100 text-blue-600",
  note_added:         "bg-gray-100 text-gray-500",
  status_changed:     "bg-purple-100 text-purple-600",
  shopping_requested: "bg-orange-100 text-orange-600",
  created:            "bg-sage-100 text-sage-700",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InventoryPageClient() {
  // ── Data state ───────────────────────────────────────────────────────────
  const [items, setItems] = useState<InventoryItem[]>(MOCK_INVENTORY_ITEMS);

  // ── View / filter ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<InventoryCategory | "All">("All");

  // ── Selected item / drawer ───────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // ── Lightbox ─────────────────────────────────────────────────────────────
  const [lightboxPhoto, setLightboxPhoto] = useState<InventoryPhoto | null>(null);

  // ── Shopping request form ────────────────────────────────────────────────
  const [shoppingFormOpen, setShoppingFormOpen] = useState(false);
  const [shoppingNote, setShoppingNote] = useState("");
  const [shoppingSubmitting, setShoppingSubmitting] = useState(false);
  const [shoppingSuccess, setShoppingSuccess] = useState(false);

  // ── Add item modal ───────────────────────────────────────────────────────
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<{
    title: string;
    category: InventoryCategory;
    count: string;
    notes: string;
    status: InventoryStatus | "";
    photoFile: File | null;
    photoPreviewUrl: string | null;
  }>({ title: "", category: "General", count: "", notes: "", status: "", photoFile: null, photoPreviewUrl: null });
  const addPhotoInputRef = useRef<HTMLInputElement>(null);

  // ── Derived data ─────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeCategory !== "All") {
      result = result.filter((i) => i.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.notes?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeCategory, searchQuery]);

  const lowCount = useMemo(
    () => items.filter((i) => i.status === "Low").length,
    [items]
  );
  const runningOutCount = useMemo(
    () => items.filter((i) => i.status === "Running Out").length,
    [items]
  );
  const pendingRequestsCount = useMemo(
    () => items.flatMap((i) => i.shopping_requests).filter((r) => r.status === "pending").length,
    [items]
  );

  // ── Effects ──────────────────────────────────────────────────────────────

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen || !!lightboxPhoto || addModalOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isDrawerOpen, lightboxPhoto, addModalOpen]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (lightboxPhoto) { setLightboxPhoto(null); return; }
      if (addModalOpen) { setAddModalOpen(false); return; }
      if (isDrawerOpen) { closeDrawer(); return; }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxPhoto, addModalOpen, isDrawerOpen]);

  // Reset photo index when item changes
  useEffect(() => { setActivePhotoIndex(0); }, [selectedItem?.id]);

  // Reset shopping form when drawer closes
  useEffect(() => {
    if (!isDrawerOpen) {
      setShoppingFormOpen(false);
      setShoppingNote("");
      setShoppingSuccess(false);
    }
  }, [isDrawerOpen]);

  // Revoke photo object URL when modal closes without submitting
  useEffect(() => {
    if (!addModalOpen && addForm.photoPreviewUrl) {
      URL.revokeObjectURL(addForm.photoPreviewUrl);
      setAddForm((f) => ({ ...f, photoFile: null, photoPreviewUrl: null }));
    }
  }, [addModalOpen]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handlePhotoSelect(file: File | null) {
    if (!file) return;
    if (addForm.photoPreviewUrl) URL.revokeObjectURL(addForm.photoPreviewUrl);
    const url = URL.createObjectURL(file);
    setAddForm((f) => ({ ...f, photoFile: file, photoPreviewUrl: url }));
  }

  function handleRemovePhoto() {
    if (addForm.photoPreviewUrl) URL.revokeObjectURL(addForm.photoPreviewUrl);
    setAddForm((f) => ({ ...f, photoFile: null, photoPreviewUrl: null }));
  }

  function handleAddItem() {
    if (!addForm.title.trim()) return;
    const now = new Date().toISOString();
    const ts = Date.now();

    const photos: InventoryPhoto[] = addForm.photoPreviewUrl
      ? [{
          id: `ph-${ts}`,
          url: addForm.photoPreviewUrl,
          uploaded_at: now,
          uploaded_by: "You",
          is_primary: true,
        }]
      : [];

    const history_log: HistoryEvent[] = [
      ...(photos.length > 0 ? [{
        id: `he-${ts}-photo`,
        action_type: "photo_added" as HistoryActionType,
        teacher_name: "You",
        count_before: null,
        count_after: null,
        timestamp: now,
        note: null,
      }] : []),
      {
        id: `he-${ts}`,
        action_type: "created" as HistoryActionType,
        teacher_name: "You",
        count_before: null,
        count_after: addForm.count !== "" ? Number(addForm.count) : null,
        timestamp: now,
        note: null,
      },
    ];

    const newItem: InventoryItem = {
      id: `inv-${ts}`,
      title: addForm.title.trim(),
      category: addForm.category,
      photos,
      status: (addForm.status as InventoryStatus) || null,
      count: addForm.count !== "" ? Number(addForm.count) : null,
      notes: addForm.notes.trim() || null,
      history_log,
      shopping_requests: [],
    };
    setItems((prev) => [newItem, ...prev]);
    setAddModalOpen(false);
    setAddForm({ title: "", category: "General", count: "", notes: "", status: "", photoFile: null, photoPreviewUrl: null });
  }

  function openItem(item: InventoryItem) {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedItem(null), 350);
  }

  function handleSubmitShoppingRequest() {
    if (!selectedItem || !shoppingNote.trim() || shoppingSubmitting) return;
    setShoppingSubmitting(true);

    setTimeout(() => {
      const newRequest: ShoppingRequest = {
        id: `sr-${Date.now()}`,
        item_id: selectedItem.id,
        requested_by: "You",
        note: shoppingNote.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
      };
      const newEvent: HistoryEvent = {
        id: `he-${Date.now()}`,
        action_type: "shopping_requested",
        teacher_name: "You",
        count_before: null,
        count_after: null,
        timestamp: new Date().toISOString(),
        note: shoppingNote.trim(),
      };

      const updateItem = (item: InventoryItem): InventoryItem => ({
        ...item,
        shopping_requests: [...item.shopping_requests, newRequest],
        history_log: [newEvent, ...item.history_log],
      });

      setItems((prev) => prev.map((i) => (i.id === selectedItem.id ? updateItem(i) : i)));
      setSelectedItem((prev) => (prev ? updateItem(prev) : prev));
      setShoppingSubmitting(false);
      setShoppingSuccess(true);
      setShoppingNote("");

      setTimeout(() => {
        setShoppingFormOpen(false);
        setShoppingSuccess(false);
      }, 1500);
    }, 600);
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 flex-shrink-0">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplies..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-gray-100 rounded-xl border border-transparent focus:border-gray-300 focus:bg-white focus:outline-none transition-colors placeholder-gray-400 font-body"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={13} className="text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex-1" />

          {/* Add Item button */}
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#4a7c59] hover:bg-[#3d6b4f] rounded-xl transition-colors font-body"
          >
            <Plus size={15} />
            Add Item
          </button>
        </div>

        {/* ── Category Filter Tabs ─────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100 px-6 flex-shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto py-3 no-scrollbar">
            {(["All", ...ALL_CATEGORIES] as Array<InventoryCategory | "All">).map((cat) => {
              const count =
                cat === "All"
                  ? items.length
                  : items.filter((i) => i.category === cat).length;
              if (count === 0 && cat !== "All") return null;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 font-body ${
                    activeCategory === cat
                      ? "bg-[#4a7c59] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                  <span
                    className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                      activeCategory === cat
                        ? "bg-white/20 text-white"
                        : "bg-white text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Status Summary Strip ─────────────────────────────────────────── */}
        {(lowCount > 0 || runningOutCount > 0 || pendingRequestsCount > 0) && (
          <div className="px-6 py-2.5 bg-white border-b border-gray-100 flex items-center gap-4 flex-shrink-0">
            {lowCount > 0 && (
              <div className="flex items-center gap-1.5 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-xs font-semibold font-body">{lowCount} Low</span>
              </div>
            )}
            {runningOutCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-xs font-semibold font-body">{runningOutCount} Running Out</span>
              </div>
            )}
            {pendingRequestsCount > 0 && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <ShoppingCart size={12} className="flex-shrink-0" />
                <span className="text-xs font-semibold font-body">
                  {pendingRequestsCount} Pending Request{pendingRequestsCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Item Grid ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600 font-body">No items found</p>
              <p className="text-xs text-gray-400 mt-1 font-body">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No items in this category yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredItems.map((item) => {
                const primaryPhoto = item.photos.find((p) => p.is_primary) ?? item.photos[0] ?? null;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => openItem(item)}
                    className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer"
                  >
                    {/* Photo zone */}
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {primaryPhoto?.url ? (
                        <img
                          src={primaryPhoto.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-sage-50">
                          <Package className="w-8 h-8 text-sage-300" />
                        </div>
                      )}

                      {/* Status badge */}
                      {item.status && (
                        <div className="absolute top-2 right-2">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CONFIG[item.status].bg} ${STATUS_CONFIG[item.status].text}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      )}

                      {/* Count pill */}
                      {item.count !== null && (
                        <div className="absolute bottom-2 left-2">
                          <span className="text-[10px] font-semibold text-white bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                            ×{item.count}
                          </span>
                        </div>
                      )}

                      {/* Photo count badge */}
                      {item.photos.length > 1 && (
                        <div className="absolute bottom-2 right-2">
                          <span className="text-[10px] font-medium text-white bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Camera size={9} />
                            {item.photos.length}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-semibold text-gray-800 truncate font-body">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 font-body mt-0.5">{item.category}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Item Detail Drawer ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDrawerOpen && selectedItem && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={closeDrawer}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[520px] z-50 bg-white flex flex-col shadow-xl overflow-hidden"
            >
              {/* Drawer header */}
              <div className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0 bg-white">
                <h2 className="text-lg font-bold font-heading text-gray-800 truncate pr-4">
                  {selectedItem.title}
                </h2>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Drawer scrollable body */}
              <div className="flex-1 overflow-y-auto">

                {/* Photo carousel */}
                <div className="relative w-full aspect-[4/3] bg-gray-100 flex-shrink-0 overflow-hidden">
                  {selectedItem.photos[activePhotoIndex]?.url ? (
                    <img
                      src={selectedItem.photos[activePhotoIndex].url!}
                      alt={selectedItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-sage-50">
                      <Package className="w-12 h-12 text-sage-300" />
                    </div>
                  )}

                  {/* Clickable overlay to open lightbox */}
                  {selectedItem.photos[activePhotoIndex]?.url && (
                    <button
                      onClick={() => setLightboxPhoto(selectedItem.photos[activePhotoIndex])}
                      className="absolute inset-0"
                      aria-label="Open full photo"
                    />
                  )}

                  {/* Prev / Next arrows */}
                  {selectedItem.photos.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActivePhotoIndex((i) => Math.max(0, i - 1)); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors z-10"
                        disabled={activePhotoIndex === 0}
                      >
                        <ChevronLeft size={16} className="text-white" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActivePhotoIndex((i) => Math.min(selectedItem.photos.length - 1, i + 1)); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors z-10"
                        disabled={activePhotoIndex === selectedItem.photos.length - 1}
                      >
                        <ChevronRight size={16} className="text-white" />
                      </button>
                    </>
                  )}

                  {/* Photo count pill */}
                  {selectedItem.photos.length > 1 && (
                    <div className="absolute bottom-3 right-3 z-10 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full pointer-events-none">
                      {activePhotoIndex + 1} / {selectedItem.photos.length}
                    </div>
                  )}

                  {/* Photo history pill */}
                  <div className="absolute bottom-3 left-3 z-10 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 pointer-events-none">
                    <Clock size={10} />
                    {selectedItem.photos.length} photo{selectedItem.photos.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Thumbnail strip */}
                {selectedItem.photos.length > 1 && (
                  <div className="flex gap-2 px-6 py-3 overflow-x-auto border-b border-gray-100 no-scrollbar flex-shrink-0">
                    {selectedItem.photos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                          idx === activePhotoIndex
                            ? "border-[#4a7c59]"
                            : "border-transparent hover:border-gray-200"
                        }`}
                      >
                        {photo.url ? (
                          <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Package size={14} className="text-gray-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Photo upload credit */}
                {selectedItem.photos[activePhotoIndex] && (
                  <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-400 font-body">
                      Added by{" "}
                      <span className="font-medium text-gray-500">
                        {selectedItem.photos[activePhotoIndex].uploaded_by}
                      </span>{" "}
                      ·{" "}
                      {new Date(selectedItem.photos[activePhotoIndex].uploaded_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </p>
                  </div>
                )}

                {/* Metadata row */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold font-heading text-gray-800 mb-2">
                        {selectedItem.title}
                      </h3>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        {selectedItem.category}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {selectedItem.status && (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${STATUS_CONFIG[selectedItem.status].bg} ${STATUS_CONFIG[selectedItem.status].text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedItem.status].dot}`}
                          />
                          {selectedItem.status}
                        </span>
                      )}
                      {selectedItem.count !== null && (
                        <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full font-body">
                          Count: {selectedItem.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedItem.notes && (
                  <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">
                      Notes
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed font-body">
                      {selectedItem.notes}
                    </p>
                  </div>
                )}

                {/* History timeline */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-4">
                    History
                  </p>
                  <div className="relative">
                    <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gray-100" />
                    <div className="space-y-4">
                      {selectedItem.history_log.map((event) => (
                        <div key={event.id} className="relative flex gap-4">
                          <div
                            className={`w-[23px] h-[23px] rounded-full flex-shrink-0 flex items-center justify-center z-10 ${HISTORY_DOT_COLORS[event.action_type]}`}
                          >
                            <HistoryIcon type={event.action_type} />
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-sm font-medium text-gray-800 font-body">
                                {HISTORY_ACTION_LABELS[event.action_type]}
                              </p>
                              <span className="text-[11px] text-gray-400 flex-shrink-0 font-body">
                                {formatRelativeTime(event.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 font-body">
                              {event.teacher_name}
                            </p>
                            {event.count_before !== null && event.count_after !== null && (
                              <p className="text-xs text-gray-500 mt-0.5 font-body">
                                {event.count_before} → {event.count_after}
                              </p>
                            )}
                            {event.note && (
                              <p className="text-xs text-gray-600 mt-1 italic font-body">
                                &ldquo;{event.note}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shopping requests */}
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3">
                    Purchase Requests
                  </p>
                  {selectedItem.shopping_requests.length === 0 ? (
                    <p className="text-sm text-gray-400 font-body">No requests yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedItem.shopping_requests.map((req) => (
                        <div
                          key={req.id}
                          className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-gray-600 font-body">
                              {req.requested_by}
                            </p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SHOPPING_STATUS_CONFIG[req.status].bg} ${SHOPPING_STATUS_CONFIG[req.status].text}`}
                            >
                              {SHOPPING_STATUS_CONFIG[req.status].label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-body">&ldquo;{req.note}&rdquo;</p>
                          <p className="text-xs text-gray-400 mt-1 font-body">
                            {formatRelativeTime(req.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Drawer footer — shopping request */}
              <div className="flex-shrink-0 bg-white border-t border-gray-100">
                <AnimatePresence>
                  {shoppingFormOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", damping: 28, stiffness: 280 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pt-4 pb-2 border-b border-gray-100 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body">
                          Request Details
                        </p>
                        <textarea
                          value={shoppingNote}
                          onChange={(e) => setShoppingNote(e.target.value)}
                          placeholder="What do you need and why? (e.g. 'Need 2 more sets for the art unit starting next week')"
                          rows={3}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors font-body"
                        />
                        <AnimatePresence>
                          {shoppingSuccess && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-xs text-green-600 font-medium flex items-center gap-1 font-body"
                            >
                              <CheckCircle size={12} /> Request submitted!
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="px-6 py-4 flex items-center gap-3">
                  {shoppingFormOpen ? (
                    <>
                      <button
                        onClick={() => {
                          setShoppingFormOpen(false);
                          setShoppingNote("");
                          setShoppingSuccess(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-body"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitShoppingRequest}
                        disabled={!shoppingNote.trim() || shoppingSubmitting}
                        className="flex-1 px-5 py-2 text-sm font-semibold text-white bg-[#4a7c59] hover:bg-[#3d6b4f] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-body"
                      >
                        {shoppingSubmitting ? "Submitting…" : "Submit Request"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShoppingFormOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#4a7c59] hover:bg-[#3d6b4f] rounded-xl transition-colors font-body"
                    >
                      <ShoppingCart size={15} />
                      Request Purchase
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Photo Lightbox ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxPhoto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/80"
              onClick={() => setLightboxPhoto(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none"
            >
              {lightboxPhoto.url && (
                <img
                  src={lightboxPhoto.url}
                  alt=""
                  className="max-w-full max-h-full rounded-2xl shadow-2xl pointer-events-auto object-contain"
                />
              )}
            </motion.div>

            {/* Close button */}
            <button
              onClick={() => setLightboxPhoto(null)}
              className="fixed top-4 right-4 z-[60] w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={18} className="text-white" />
            </button>

            {/* Metadata pill */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-black/60 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full pointer-events-none">
              Added by {lightboxPhoto.uploaded_by} ·{" "}
              {new Date(lightboxPhoto.uploaded_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add Item Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {addModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              onClick={() => setAddModalOpen(false)}
            />

            {/* Centered panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <h2 className="text-base font-bold font-heading text-gray-800">Add Item</h2>
                  <button
                    onClick={() => setAddModalOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>

                {/* Form */}
                <div className="px-6 py-5 space-y-4 overflow-y-auto">

                  {/* Photo upload */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 font-body">
                      Photo <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                      ref={addPhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoSelect(e.target.files?.[0] ?? null)}
                    />
                    {addForm.photoPreviewUrl ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200">
                        <img src={addForm.photoPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                        >
                          <X size={13} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addPhotoInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handlePhotoSelect(e.dataTransfer.files[0] ?? null); }}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#4a7c59]/50 hover:text-[#4a7c59] transition-colors cursor-pointer"
                      >
                        <Camera size={22} />
                        <span className="text-xs font-medium font-body">Click or drag to upload a photo</span>
                      </button>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 font-body">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={addForm.title}
                      onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Watercolor Paint Set"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors font-body"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 font-body">
                      Category
                    </label>
                    <select
                      value={addForm.category}
                      onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value as InventoryCategory }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors font-body bg-white"
                    >
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Count + Status row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 font-body">
                        Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={addForm.count}
                        onChange={(e) => setAddForm((f) => ({ ...f, count: e.target.value }))}
                        placeholder="Optional"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors font-body"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 font-body">
                        Status
                      </label>
                      <select
                        value={addForm.status ?? ""}
                        onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value as InventoryStatus | "" }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors font-body bg-white"
                      >
                        <option value="">None</option>
                        <option value="Full">Full</option>
                        <option value="Running Out">Running Out</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 font-body">
                      Notes
                    </label>
                    <textarea
                      value={addForm.notes}
                      onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Optional — storage location, condition, etc."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors font-body"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-body"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItem}
                    disabled={!addForm.title.trim()}
                    className="flex-1 px-5 py-2 text-sm font-semibold text-white bg-[#4a7c59] hover:bg-[#3d6b4f] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-body"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
