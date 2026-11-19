// New message: pick a teacher, then find-or-create the conversation.
import { isParentVisibleTeacher, fetchParentVisibleTeachers } from "@/lib/parent-visible-teachers";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { escapeLike, findOrCreateConversation, type Result, type TeacherSuggestion } from "./messagingApi";

export function useComposeMessage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TeacherSuggestion[]>([]);
  const [suggested, setSuggested] = useState<TeacherSuggestion[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const searchSeq = useRef(0);

  useEffect(() => {
    void fetchParentVisibleTeachers()
      .then(setSuggested)
      .finally(() => setSuggestedLoading(false));
  }, []);

  // Debounced search; only the newest response lands.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      searchSeq.current++;
      setResults([]);
      setSearching(false);
      return;
    }
    const seq = ++searchSeq.current;
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .schema("admin")
        .from("users")
        .select("id, full_name, profile_image_url")
        .ilike("full_name", `%${escapeLike(q)}%`)
        .in("role", ["teacher", "super_admin"])
        .limit(20);
      if (seq !== searchSeq.current) return;
      setResults(
        ((data ?? []) as TeacherSuggestion[]).filter((u) => isParentVisibleTeacher(u.full_name)),
      );
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const select = useCallback(
    async (u: TeacherSuggestion): Promise<Result> => {
      if (selectingId) return { ok: true };
      setSelectingId(u.id);
      const r = await findOrCreateConversation(u.id);
      setSelectingId(null);
      if (!r.ok) return { ok: false, error: r.error };
      router.replace({
        pathname: "/(tabs)/messages/[id]",
        params: {
          id: r.conversationId,
          otherUserName: u.full_name,
          otherUserAvatar: u.profile_image_url ?? "",
          otherUserId: u.id,
        },
      });
      return { ok: true };
    },
    [router, selectingId],
  );

  const showingSearch = query.trim().length >= 2;
  return {
    router,
    query,
    setQuery,
    list: showingSearch ? results : suggested,
    showingSearch,
    searching,
    suggestedLoading,
    selectingId,
    select,
  };
}

export type ComposeMessage = ReturnType<typeof useComposeMessage>;
