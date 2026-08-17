import { Image, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Brand, FontFamilies } from "@/constants/theme";
import type { TeacherIdCard as TeacherIdCardType } from "@/lib/teacher-id-actions";

const LOGO = require("@/assets/images/Logo.png");

const FALLBACK_PHOTOS: Record<string, number> = {
  "6db16988-f41e-4249-b3fa-7b6720d11ac0": require("@/assets/images/Headshot.webp"),
  "bd562de1-18c2-4b47-91d7-5f0b93fee107": require("@/assets/images/team/Zelinda.webp"),
  "68709384-b054-4f38-a4ee-81554dad2eb8": require("@/assets/images/team/Joy.png"),
};

type CardSize = "small" | "large" | "preview";

type Props = {
  card: Pick<
    TeacherIdCardType,
    "full_name" | "title" | "grade_classroom" | "issue_year" | "photo_url" | "user_id"
  >;
  size?: CardSize;
  style?: ViewStyle;
};

function getPhotoSource(card: Props["card"]) {
  if (card.photo_url) return { uri: card.photo_url };
  if (card.user_id && FALLBACK_PHOTOS[card.user_id]) {
    return FALLBACK_PHOTOS[card.user_id];
  }
  return null;
}

export function TeacherIdCard({ card, size = "large", style }: Props) {
  const isSmall = size === "small";
  const isPreview = size === "preview";
  const photoSource = getPhotoSource(card);

  return (
    <View
      style={[
        styles.card,
        isSmall && styles.cardSmall,
        isPreview && styles.cardPreview,
        style,
      ]}
    >
      <View
        style={[
          styles.header,
          isSmall && styles.headerSmall,
          isPreview && styles.headerPreview,
        ]}
      >
        <Image
          source={LOGO}
          style={[
            styles.logo,
            isSmall && styles.logoSmall,
            isPreview && styles.logoPreview,
          ]}
          resizeMode="contain"
        />
        <View style={styles.headerText}>
          <Text
            style={[
              styles.schoolName,
              isSmall && styles.schoolNameSmall,
              isPreview && styles.schoolNamePreview,
            ]}
          >
            Sage Field
          </Text>
          <Text
            style={[
              styles.schoolSub,
              isSmall && styles.schoolSubSmall,
              isPreview && styles.schoolSubPreview,
            ]}
          >
            Private School
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.body,
          isSmall && styles.bodySmall,
          isPreview && styles.bodyPreview,
        ]}
      >
        <View
          style={[
            styles.photoRing,
            isSmall && styles.photoRingSmall,
            isPreview && styles.photoRingPreview,
          ]}
        >
          {photoSource ? (
            <Image
              source={photoSource}
              style={[
                styles.photo,
                isSmall && styles.photoSmall,
                isPreview && styles.photoPreview,
              ]}
            />
          ) : (
            <View
              style={[
                styles.photoPlaceholder,
                isSmall && styles.photoSmall,
                isPreview && styles.photoPreview,
              ]}
            >
              <Text
                style={[
                  styles.initials,
                  isSmall && styles.initialsSmall,
                  isPreview && styles.initialsPreview,
                ]}
              >
                {card.full_name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.name,
            isSmall && styles.nameSmall,
            isPreview && styles.namePreview,
          ]}
          numberOfLines={2}
        >
          {card.full_name}
        </Text>
        <Text
          style={[
            styles.title,
            isSmall && styles.titleSmall,
            isPreview && styles.titlePreview,
          ]}
        >
          {card.title}
        </Text>
        {card.grade_classroom ? (
          <Text
            style={[
              styles.grade,
              isSmall && styles.gradeSmall,
              isPreview && styles.gradePreview,
            ]}
            numberOfLines={2}
          >
            {card.grade_classroom}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.footer,
          isSmall && styles.footerSmall,
          isPreview && styles.footerPreview,
        ]}
      >
        <Text
          style={[
            styles.issued,
            isSmall && styles.issuedSmall,
            isPreview && styles.issuedPreview,
          ]}
        >
          Issued {card.issue_year}
        </Text>
        <Text
          style={[
            styles.official,
            isSmall && styles.officialSmall,
            isPreview && styles.officialPreview,
          ]}
        >
          OFFICIAL STAFF ID
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardSmall: {
    width: 160,
    borderRadius: 12,
  },
  cardPreview: {
    width: 320,
    borderRadius: 18,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    backgroundColor: Brand.sage700,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  headerSmall: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  headerPreview: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
  },
  logoSmall: {
    width: 24,
    height: 24,
  },
  logoPreview: {
    width: 42,
    height: 42,
  },
  headerText: {
    flex: 1,
  },
  schoolName: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.3,
  },
  schoolNameSmall: {
    fontSize: 11,
  },
  schoolNamePreview: {
    fontSize: 18,
  },
  schoolSub: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 1,
  },
  schoolSubSmall: {
    fontSize: 8,
  },
  schoolSubPreview: {
    fontSize: 12,
  },
  body: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  bodySmall: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  bodyPreview: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  photoRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: Brand.sage700,
    padding: 3,
    marginBottom: 14,
  },
  photoRingSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    marginBottom: 8,
  },
  photoRingPreview: {
    width: 124,
    height: 124,
    borderRadius: 62,
    marginBottom: 16,
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
  },
  photoSmall: {
    borderRadius: 28,
  },
  photoPreview: {
    borderRadius: 56,
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: FontFamilies.heading,
    fontSize: 28,
    color: "#fff",
  },
  initialsSmall: {
    fontSize: 18,
  },
  initialsPreview: {
    fontSize: 32,
  },
  name: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: Brand.sage800,
    textAlign: "center",
    marginBottom: 4,
  },
  nameSmall: {
    fontSize: 13,
    marginBottom: 2,
  },
  namePreview: {
    fontSize: 22,
    marginBottom: 6,
  },
  title: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
    textAlign: "center",
  },
  titleSmall: {
    fontSize: 10,
  },
  titlePreview: {
    fontSize: 16,
  },
  grade: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
  gradeSmall: {
    fontSize: 9,
    marginTop: 2,
  },
  gradePreview: {
    fontSize: 14,
    marginTop: 6,
  },
  footer: {
    backgroundColor: "#f3f4f6",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 12,
    alignItems: "center",
    gap: 2,
  },
  footerSmall: {
    paddingVertical: 8,
  },
  footerPreview: {
    paddingVertical: 14,
    gap: 4,
  },
  issued: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  issuedSmall: {
    fontSize: 9,
  },
  issuedPreview: {
    fontSize: 13,
  },
  official: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage800,
    letterSpacing: 1.2,
  },
  officialSmall: {
    fontSize: 7,
    letterSpacing: 0.8,
  },
  officialPreview: {
    fontSize: 11,
    letterSpacing: 1.4,
  },
});
