import { Brand, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Static assets ─────────────────────────────────────────────────────────────

const TEACHER_PHOTOS: Record<string, ImageSourcePropType> = {
  "Sabrina Obnamia": require("@/assets/images/Headshot.webp"),
  "Zelinda Melo": require("@/assets/images/team/Zelinda.webp"),
  "Paige Wood": require("@/assets/images/team/Paige.webp"),
};

const GALLERY_IMAGES: ImageSourcePropType[] = [
  require("@/assets/images/Homeschool.webp"),
  require("@/assets/images/Homeschool2.webp"),
  require("@/assets/images/Homeschool3.webp"),
  require("@/assets/images/ImageOne.webp"),
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeacherProfile {
  full_name: string;
  role: string | null;
  profile_image_url: string | null;
}

interface QualificationRow {
  id: string;
  icon: string;
  text: string;
  sort_order: number;
}

interface ExperienceRow {
  id: string;
  role: string;
  place: string;
  period: string;
  is_current: boolean;
  detail: string | null;
  sort_order: number;
}

interface TeacherStudentRow {
  id: string;
  student_id: string;
  program: string | null;
  classroom: string | null;
}

interface StudentRow {
  id: string;
  child_legal_name: string;
  child_grade: string | null;
  profile_image_url: string | null;
}

interface EnrichedStudent extends StudentRow {
  program: string | null;
  classroom: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatProgramLabel(value: string): string {
  const summerMatch = value.match(/^summer_(\d{2})$/i);
  if (summerMatch) return `☀️ Summer 20${summerMatch[1]}`;
  const syMatch = value.match(/^school_year_(\d{2})_(\d{2})$/i);
  if (syMatch) return `🎒 School Year ${syMatch[1]}-${syMatch[2]}`;
  return formatLabel(value);
}

function getRoleLabel(role: string | null): string {
  if (!role) return "Lead Teacher";
  const map: Record<string, string> = {
    super_admin: "Lead Teacher",
    teacher: "Teacher",
    admin: "Administrator",
  };
  return map[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TeacherProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    teacherId: string;
    teacherName: string;
    classroom: string;
    program: string;
  }>();

  const { teacherId, teacherName, classroom, program } = params;

  // ── State ─────────────────────────────────────────────────────────────────
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProgram, setActiveProgram] = useState<string>("");
  const [expandedExpId, setExpandedExpId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [yearsExp, setYearsExp] = useState<string | null>(null);
  const [gradeRange, setGradeRange] = useState<string | null>(null);
  const [qualifications, setQualifications] = useState<QualificationRow[]>([]);
  const [experience, setExperience] = useState<ExperienceRow[]>([]);

  // ── Animations ────────────────────────────────────────────────────────────
  // 5 section animations: profile, about, experience, gallery, students
  const sectionAnims = useRef(
    Array.from({ length: 5 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(22),
    }))
  ).current;

  // Stable style objects for Animated.Views — sectionAnims is a ref and never reassigned
  const animStyles = useMemo(
    () =>
      sectionAnims.map((anim) => ({
        opacity: anim.opacity,
        transform: [{ translateY: anim.translateY }],
      })),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!loadingProfile) {
      Animated.stagger(
        80,
        sectionAnims.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.opacity, { toValue: 1, duration: 360, useNativeDriver: true }),
            Animated.timing(anim.translateY, { toValue: 0, duration: 360, useNativeDriver: true }),
          ])
        )
      ).start();
    }
  }, [loadingProfile]);

  // ── Data Fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;

    async function fetchTeacherProfile() {
      const { data, error: profileError } = await supabase
        .schema("admin")
        .from("users")
        .select("full_name, role, profile_image_url")
        .eq("id", teacherId)
        .single();

      if (cancelled) return;
      if (profileError || !data) {
        setError(profileError?.message ?? "Failed to load teacher profile.");
        setLoadingProfile(false);
        return;
      }
      setTeacherProfile(data);
      setLoadingProfile(false);
    }

    async function fetchStudents() {
      // Fetch ALL assignment rows for this teacher (mirrors staff/students/index.tsx pattern)
      const { data: assignmentRows } = await supabase
        .schema("teachers")
        .from("teacher_students")
        .select("id, student_id, program, classroom")
        .eq("teacher_id", teacherId)
        .eq("is_deleted", false);

      if (cancelled) return;
      if (!assignmentRows || assignmentRows.length === 0) {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }

      const studentIds = assignmentRows.map((a: TeacherStudentRow) => a.student_id);

      const { data: studentProfiles } = await supabase
        .schema("admin")
        .from("students")
        .select("id, child_legal_name, child_grade, profile_image_url")
        .in("id", studentIds)
        .eq("is_deleted", false);

      if (cancelled) return;

      // Build lookup by student id — same approach as staff/students/index.tsx
      const profileById: Record<string, StudentRow> = {};
      for (const s of studentProfiles ?? []) {
        profileById[s.id] = s;
      }

      // Map over assignments (not over studentProfiles) so every assigned student appears
      // Use assignment id as the unique key to avoid duplicates when same student has multiple programs
      const enriched: EnrichedStudent[] = assignmentRows.map((a: TeacherStudentRow) => ({
        id: a.id,
        child_legal_name: profileById[a.student_id]?.child_legal_name ?? "Unknown Student",
        child_grade: profileById[a.student_id]?.child_grade ?? null,
        profile_image_url: profileById[a.student_id]?.profile_image_url ?? null,
        program: a.program ?? null,
        classroom: a.classroom ?? null,
      }));

      setStudents(enriched);
      const summerProgram = enriched.find((s) => /^summer_/i.test(s.program ?? ""))?.program;
      const firstProgram = summerProgram ?? enriched[0]?.program ?? "Unassigned";
      setActiveProgram((prev) => (prev === "" ? firstProgram : prev));
      setLoadingStudents(false);
    }

    fetchTeacherProfile();
    fetchStudents();
    return () => { cancelled = true; };
  }, [teacherId]);

  useFocusEffect(
    useCallback(() => {
      if (!teacherId) return;
      let cancelled = false;

      async function fetchProfileExtras() {
        const [profileRes, qualsRes, expRes] = await Promise.all([
          supabase
            .schema("teachers")
            .from("teacher_profiles")
            .select("bio, quote, years_experience, grade_range")
            .eq("user_id", teacherId)
            .single(),
          supabase
            .schema("teachers")
            .from("teacher_qualifications")
            .select("id, icon, text, sort_order")
            .eq("user_id", teacherId)
            .eq("is_deleted", false)
            .order("sort_order"),
          supabase
            .schema("teachers")
            .from("teacher_experience")
            .select("id, role, place, period, is_current, detail, sort_order")
            .eq("user_id", teacherId)
            .eq("is_deleted", false)
            .order("sort_order"),
        ]);

        if (cancelled) return;
        if (profileRes.data) {
          setBio(profileRes.data.bio ?? null);
          setQuote(profileRes.data.quote ?? null);
          setYearsExp(profileRes.data.years_experience ?? null);
          setGradeRange(profileRes.data.grade_range ?? null);
        }
        if (qualsRes.data) setQualifications(qualsRes.data);
        if (expRes.data) setExperience(expRes.data);
      }

      fetchProfileExtras();
      return () => { cancelled = true; };
    }, [teacherId])
  );

  useEffect(() => {
    async function fetchCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      const { data } = await supabase
        .schema("admin")
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (data?.role) setCurrentUserRole(data.role);
    }
    fetchCurrentUser();
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const uniquePrograms = useMemo(() => {
    const programs = [...new Set(students.map((s) => s.program ?? "Unassigned"))];
    return programs.sort((a, b) => {
      const aIsSummer = /^summer_/i.test(a);
      const bIsSummer = /^summer_/i.test(b);
      if (aIsSummer && !bIsSummer) return -1;
      if (!aIsSummer && bIsSummer) return 1;
      return 0;
    });
  }, [students]);

  const filteredStudents = useMemo(
    () => students.filter((s) => (s.program ?? "Unassigned") === activeProgram),
    [students, activeProgram]
  );

  const canEditProfile =
    !!currentUserId &&
    currentUserId === teacherId &&
    (currentUserRole === "teacher" || currentUserRole === "super_admin");

  const displayName = teacherProfile?.full_name ?? teacherName ?? "Teacher";
  const roleLabel = getRoleLabel(teacherProfile?.role ?? null);

  const photoSource: ImageSourcePropType | { uri: string } | null =
    TEACHER_PHOTOS[displayName] ??
    (teacherProfile?.profile_image_url ? { uri: teacherProfile.profile_image_url } : null);

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#EDF4EF", "#ffffff"]}
          style={[styles.profileSection, { paddingTop: insets.top + 16, paddingBottom: 28 }]}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color={Brand.sage700} />
          </TouchableOpacity>
          <View style={{ alignItems: "center", marginTop: 8, gap: 10 }}>
            <SkeletonBox width={108} height={108} borderRadius={54} />
            <SkeletonBox width={160} height={20} borderRadius={4} />
            <SkeletonBox width={100} height={14} borderRadius={4} />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <SkeletonBox width={90} height={26} borderRadius={13} />
              <SkeletonBox width={90} height={26} borderRadius={13} />
            </View>
            <SkeletonBox width="90%" height={44} borderRadius={10} style={{ marginTop: 6 }} />
          </View>
        </LinearGradient>
        <View style={{ paddingHorizontal: 20, paddingTop: 28, gap: 10 }}>
          <SkeletonBox width={60} height={16} borderRadius={4} />
          <SkeletonBox width="100%" height={14} borderRadius={4} />
          <SkeletonBox width="85%" height={14} borderRadius={4} />
          <SkeletonBox width="70%" height={14} borderRadius={4} />
        </View>
      </View>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.errorBackLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ────────────────────────────────────────────────── */}
        <Animated.View style={animStyles[0]}>
          <LinearGradient
            colors={["#EDF4EF", "#f8faf8", "#ffffff"]}
            locations={[0, 0.6, 1]}
            style={[styles.profileSection, { paddingTop: insets.top + 16 }]}
          >
            {/* Back button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={20} color={Brand.sage700} />
            </TouchableOpacity>

            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarRing}>
                {photoSource ? (
                  <Image
                    source={photoSource}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Name + role */}
            <Text style={styles.teacherName}>{displayName}</Text>
            <Text style={styles.teacherRole}>{roleLabel}</Text>

            {/* Badges */}
            <View style={styles.badgeRow}>
              {program ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{formatLabel(program)}</Text>
                </View>
              ) : null}
              {classroom ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {classroom.includes("_")
                      ? classroom.split("_").join(" - ") + " Grade"
                      : classroom}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {loadingStudents ? "—" : String(students.length)}
                </Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{yearsExp ?? "—"}</Text>
                <Text style={styles.statLabel}>Years Exp.</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{gradeRange ?? "—"}</Text>
                <Text style={styles.statLabel}>Grade Range</Text>
              </View>
            </View>

            {/* Action buttons */}
            {canEditProfile ? (
              <View style={styles.actionButtonRow}>
                <TouchableOpacity
                  style={styles.editProfileButton}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: "/(staff)/edit-profile",
                      params: { teacherId },
                    })
                  }
                >
                  <Ionicons name="pencil-outline" size={15} color="#ffffff" />
                  <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButtonInRow} activeOpacity={0.75}>
                  <Ionicons name="chatbubble-outline" size={15} color={Brand.sage700} />
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.messageButton} activeOpacity={0.75}>
                <Ionicons name="chatbubble-outline" size={16} color={Brand.sage700} />
                <Text style={styles.messageButtonText}>Send a Message</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ── About ─────────────────────────────────────────────────────────── */}
        {(bio || quote) && (
          <>
            <View style={styles.divider} />
            <Animated.View style={[styles.section, animStyles[1]]}>
              <Text style={styles.sectionTitle}>About</Text>
              {bio ? <Text style={styles.bioText}>{bio}</Text> : null}
              {quote ? <Text style={styles.quoteText}>"{quote}"</Text> : null}
            </Animated.View>
          </>
        )}

        {/* ── Experience + Qualifications ───────────────────────────────────── */}
        {(experience.length > 0 || qualifications.length > 0) && (
          <>
            <View style={styles.divider} />
            <Animated.View style={[styles.section, animStyles[2]]}>
              {experience.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Experience</Text>
                  <View style={styles.timelineList}>
                    {experience.map((item, index) => {
                      const isExpanded = expandedExpId === item.id;
                      const isLast = index === experience.length - 1;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => setExpandedExpId(isExpanded ? null : item.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.timelineRow}>
                            <View style={styles.timelineLeft}>
                              <View style={[styles.timelineDot, item.is_current && styles.timelineDotCurrent]} />
                              {!isLast && <View style={styles.timelineLine} />}
                            </View>
                            <View style={[styles.timelineContent, !isLast && { paddingBottom: 20 }]}>
                              <View style={styles.timelineHeader}>
                                <View style={{ flex: 1, gap: 2 }}>
                                  <Text style={styles.timelineRole}>{item.role}</Text>
                                  <Text style={styles.timelinePlace}>{item.place}</Text>
                                  <View style={styles.timelineMetaRow}>
                                    <Text style={styles.timelinePeriod}>{item.period}</Text>
                                    {item.is_current && (
                                      <View style={styles.currentBadge}>
                                        <Text style={styles.currentBadgeText}>Current</Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                                {item.detail ? (
                                  <Ionicons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color="#9ca3af"
                                  />
                                ) : null}
                              </View>
                              {isExpanded && item.detail ? (
                                <Text style={styles.timelineDetail}>{item.detail}</Text>
                              ) : null}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {qualifications.length > 0 && (
                <>
                  {experience.length > 0 && (
                    <View style={[styles.divider, { marginVertical: 4 }]} />
                  )}
                  <Text style={[styles.sectionTitle, experience.length > 0 && { marginTop: 8 }]}>
                    Qualifications
                  </Text>
                  <View style={styles.qualList}>
                    {qualifications.map((q) => (
                      <View key={q.id} style={styles.qualRow}>
                        <View style={styles.qualIcon}>
                          <Ionicons name={q.icon as any} size={16} color={Brand.sage700} />
                        </View>
                        <Text style={styles.qualText}>{q.text}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </Animated.View>
          </>
        )}

        {/* ── Classroom Moments ─────────────────────────────────────────────── */}
        <View style={styles.divider} />
        <Animated.View style={animStyles[3]}>
          <View style={styles.sectionHeaderPadded}>
            <Text style={styles.sectionTitle}>Classroom Moments</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}
          >
            {GALLERY_IMAGES.map((src, i) => (
              <Image
                key={i}
                source={src}
                style={styles.galleryTile}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Students ─────────────────────────────────────────────────────── */}
        <View style={[styles.divider, { marginTop: 24 }]} />
        <Animated.View style={[styles.section, animStyles[4]]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Students</Text>
            {!loadingStudents && students.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filteredStudents.length}</Text>
              </View>
            )}
          </View>

          {/* Program filter — only when more than 1 program */}
          {uniquePrograms.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillRow}
              style={styles.filterPillScroll}
            >
              {uniquePrograms.map((prog) => {
                const active = prog === activeProgram;
                return (
                  <TouchableOpacity
                    key={prog}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                    onPress={() => setActiveProgram(prog)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                      {formatProgramLabel(prog)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {loadingStudents ? (
            <View style={{ gap: 10, marginTop: 4 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.studentCardSkeleton}>
                  <SkeletonBox width={44} height={44} borderRadius={22} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonBox width="55%" height={13} borderRadius={4} />
                    <SkeletonBox width="40%" height={11} borderRadius={4} />
                  </View>
                </View>
              ))}
            </View>
          ) : filteredStudents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No students assigned yet.</Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 4 }}>
              {filteredStudents.map((s) => (
                <View key={s.id} style={styles.studentCard}>
                  <View style={styles.studentAvatar}>
                    {s.profile_image_url ? (
                      <Image
                        source={{ uri: s.profile_image_url }}
                        style={styles.studentAvatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.studentAvatarInitials}>
                        {getInitials(s.child_legal_name)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {s.child_legal_name}
                    </Text>
                    <View style={styles.studentMetaRow}>
                      {s.child_grade && (
                        <View style={styles.metaChip}>
                          <Text style={styles.metaChipText}>{s.child_grade}</Text>
                        </View>
                      )}
                      {s.classroom && (
                        <View style={styles.metaChip}>
                          <Text style={styles.metaChipText}>
                            {s.classroom.includes("_")
                              ? s.classroom.split("_").join(" - ")
                              : s.classroom}
                          </Text>
                        </View>
                      )}
                      {s.program && (
                        <Text style={styles.studentProgram} numberOfLines={1}>
                          {formatProgramLabel(s.program)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // ── Profile header section ────────────────────────────────────────────────
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 6,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarWrapper: {
    marginBottom: 6,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 4,
    borderColor: "#ffffff",
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarImage: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  avatarFallback: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0EDE2",
  },
  avatarInitials: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 36,
    color: Brand.sage700,
  },
  teacherName: {
    fontFamily: FontFamilies.heading,
    fontSize: 23,
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 32,
  },
  teacherRole: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 4,
  },
  badge: {
    backgroundColor: "rgba(94,124,104,0.1)",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#C8DFCB",
  },
  badgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(200,223,203,0.6)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 0,
    alignSelf: "stretch",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 18,
    color: "#1f2937",
  },
  statLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#e5e7eb",
  },
  actionButtonRow: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "stretch",
    marginTop: 8,
  },
  editProfileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: Brand.sage700,
  },
  editProfileButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#C8DFCB",
    backgroundColor: "#F2F7F3",
    alignSelf: "stretch",
  },
  messageButtonInRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#C8DFCB",
    backgroundColor: "#F2F7F3",
  },
  messageButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },

  // ── Layout helpers ─────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  sectionHeaderPadded: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },

  // ── About ──────────────────────────────────────────────────────────────────
  bioText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 23,
  },
  quoteText: {
    fontFamily: FontFamilies.signature,
    fontSize: 19,
    color: Brand.sage700,
    lineHeight: 30,
    marginTop: 2,
  },

  // ── Experience timeline ────────────────────────────────────────────────────
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineLeft: {
    alignItems: "center",
    width: 16,
    paddingTop: 4,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#d1d5db",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  timelineDotCurrent: {
    backgroundColor: Brand.sage700,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#f3f4f6",
    marginTop: 4,
    marginBottom: -2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
    gap: 6,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  timelineRole: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  timelinePlace: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
  },
  timelineMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  timelinePeriod: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  currentBadge: {
    backgroundColor: "rgba(94,124,104,0.12)",
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: Brand.sage700,
  },
  timelineDetail: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 21,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },

  // ── Qualifications ─────────────────────────────────────────────────────────
  qualList: {
    gap: 10,
  },
  qualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qualIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(94,124,104,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  qualText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },

  // ── Gallery ────────────────────────────────────────────────────────────────
  galleryRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 12,
  },
  galleryTile: {
    width: 165,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#E0EDE2",
    overflow: "hidden",
  },

  // ── Students ───────────────────────────────────────────────────────────────
  countBadge: {
    backgroundColor: "rgba(94,124,104,0.1)",
    borderRadius: 9999,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
  filterPillScroll: {
    flexGrow: 0,
  },
  filterPillRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  filterPillActive: {
    borderColor: Brand.sage700,
    backgroundColor: "rgba(74,124,89,0.08)",
  },
  filterPillText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  filterPillTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  studentAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  studentAvatarInitials: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  studentInfo: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  studentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  metaChip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  metaChipText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#4b5563",
  },
  studentProgram: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: Brand.sage700,
  },
  studentCardSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 13,
  },

  // ── Error & empty ──────────────────────────────────────────────────────────
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#ffe4e6",
    borderRadius: 12,
    padding: 16,
    width: "100%",
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#be123c",
  },
  errorBackLink: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  emptyCard: {
    backgroundColor: "#F2F7F3",
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#4b5563",
  },
});
