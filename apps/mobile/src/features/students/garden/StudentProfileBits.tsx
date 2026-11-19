// Garden student-profile pieces shared by the staff student detail screen and
// the staff Attendance profile sheet: info cards (Demographics, Learning
// Profile, Regulation, Health Flags) and guardian / emergency contact cards
// with call, email and copy. Copy is kept word for word from the old screens.
import {
  Garden,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  GardenTints,
  MIN_TAP,
  PressableScale,
  gardenCard,
  haptic,
  useToast,
} from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export type StudentProfileInfo = {
  child_legal_name: string | null;
  child_grade: string | null;
  dob_day: string | null;
  dob_month: string | null;
  dob_year: string | null;
  learning_style: string | null;
  special_interests: string | null;
  strengths_interests: string | null;
  current_challenges: string | null;
  dysregulation_response: string | null;
  regulation_strategies: string | null;
  activities_to_avoid: string | null;
  has_medical_conditions: string | null;
  medical_conditions_description: string | null;
  has_allergies: string | null;
  allergies_description: string | null;
  emergency_medications: string | null;
  needs_aide: string | null;
};

export type StudentContacts = {
  g1_full_name: string | null;
  g1_relationship: string | null;
  g1_cell_phone: string | null;
  g1_work_phone: string | null;
  g1_email: string | null;
  g2_full_name: string | null;
  g2_relationship: string | null;
  g2_cell_phone: string | null;
  g2_work_phone: string | null;
  g2_email: string | null;
  in_state_contact_name: string | null;
  in_state_contact_relation: string | null;
  in_state_contact_phone: string | null;
  out_of_state_contact_name: string | null;
  out_of_state_contact_relation: string | null;
  out_of_state_contact_phone: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Cards
// ─────────────────────────────────────────────────────────────────────────────
export function ProfileCard({
  title,
  icon,
  tint = "sage",
  right,
  children,
}: {
  title: string;
  icon?: IoniconName;
  tint?: keyof typeof GardenTints;
  right?: ReactNode;
  children: ReactNode;
}) {
  const t = GardenTints[tint];
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        {icon ? (
          <View style={[s.cardIcon, { backgroundColor: t.bg }]}>
            <Ionicons name={icon} size={16} color={t.fg} />
          </View>
        ) : null}
        <Text style={s.cardTitle} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
          {title}
        </Text>
        {right}
      </View>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value || "not on file"}`}>
      <Text style={s.label} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text style={[s.value, !value && { color: Garden.muted }]} maxFontSizeMultiplier={1.4}>
        {value || "—"}
      </Text>
    </View>
  );
}

const yesNo = (flag: string | null, desc: string | null) =>
  flag === "yes" ? desc : flag === "no" ? "None" : null;

export function InfoCards({ student }: { student: StudentProfileInfo }) {
  const dob =
    student.dob_month && student.dob_day && student.dob_year
      ? `${student.dob_month}/${student.dob_day}/${student.dob_year}`
      : null;
  return (
    <View style={{ gap: 12 }}>
      <ProfileCard title="Demographics" icon="person-outline" tint="sky">
        <InfoRow label="Legal Name" value={student.child_legal_name} />
        <InfoRow label="Grade" value={student.child_grade} />
        <InfoRow label="Date of Birth" value={dob} />
      </ProfileCard>
      <ProfileCard title="Learning Profile" icon="bulb-outline" tint="butter">
        <InfoRow label="Learning Style" value={student.learning_style} />
        <InfoRow label="Special Interests" value={student.special_interests} />
        <InfoRow label="Strengths & Interests" value={student.strengths_interests} />
        <InfoRow label="Current Challenges" value={student.current_challenges} />
      </ProfileCard>
      <ProfileCard title="Regulation" icon="leaf-outline" tint="mint">
        <InfoRow label="Dysregulation Response" value={student.dysregulation_response} />
        <InfoRow label="Regulation Strategies" value={student.regulation_strategies} />
        <InfoRow label="Activities to Avoid" value={student.activities_to_avoid} />
      </ProfileCard>
      <ProfileCard title="Health Flags" icon="medkit-outline" tint="coral">
        <InfoRow label="Allergies" value={yesNo(student.has_allergies, student.allergies_description)} />
        <InfoRow
          label="Medical Conditions"
          value={yesNo(student.has_medical_conditions, student.medical_conditions_description)}
        />
        <InfoRow label="Emergency Medications" value={student.emergency_medications} />
        <InfoRow label="Needs Aide" value={student.needs_aide} />
      </ProfileCard>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Contacts
// ─────────────────────────────────────────────────────────────────────────────
function ContactLine({
  label,
  value,
  kind,
}: {
  label: string;
  value: string;
  kind: "tel" | "mailto";
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const open = async () => {
    try {
      await Linking.openURL(`${kind}:${value}`);
    } catch {
      toast.show({
        tone: "error",
        title: kind === "tel" ? "Can't place calls here" : "No mail app found",
        message: "Copy it instead and use another device.",
      });
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(value);
    haptic.success();
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
    toast.show({ tone: "success", title: `Copied ${value}`, duration: 1600, silent: true });
  };

  return (
    <View style={s.line}>
      <PressableScale
        onPress={() => void open()}
        pressedScale={0.98}
        accessibilityRole="link"
        accessibilityLabel={`${kind === "tel" ? "Call" : "Email"} ${label}, ${value}`}
        style={s.lineMain}
      >
        <View style={s.lineIcon}>
          <Ionicons
            name={kind === "tel" ? "call" : "mail"}
            size={15}
            color={Garden.sageDeep}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label} maxFontSizeMultiplier={1.3}>
            {label}
          </Text>
          <Text style={s.link} numberOfLines={1} maxFontSizeMultiplier={1.4}>
            {value}
          </Text>
        </View>
      </PressableScale>
      <PressableScale
        onPress={() => void copy()}
        haptics={false}
        accessibilityLabel={`Copy ${label.toLowerCase()} ${value}`}
        style={[s.copyBtn, copied && { backgroundColor: GardenTints.sage.bg }]}
      >
        <Ionicons
          name={copied ? "checkmark" : "copy-outline"}
          size={17}
          color={copied ? Garden.sageDeep : Garden.muted}
        />
      </PressableScale>
    </View>
  );
}

export function ContactCard({
  title,
  name,
  relationship,
  cellPhone,
  workPhone,
  email,
  emergency,
}: {
  title: string;
  name: string | null;
  relationship: string | null;
  cellPhone?: string | null;
  workPhone?: string | null;
  email?: string | null;
  emergency?: boolean;
}) {
  const icon: IoniconName = emergency ? "alert-circle-outline" : "people-outline";
  const tint = emergency ? "peach" : "sage";
  if (!name) {
    return (
      <ProfileCard title={title} icon={icon} tint={tint}>
        <Text style={[s.value, { color: Garden.muted }]}>No information on file.</Text>
      </ProfileCard>
    );
  }
  return (
    <ProfileCard
      title={title}
      icon={icon}
      tint={tint}
      right={
        relationship ? (
          <View style={s.relation}>
            <Text style={s.relationText} maxFontSizeMultiplier={1.3}>
              {relationship}
            </Text>
          </View>
        ) : null
      }
    >
      <Text style={s.contactName} maxFontSizeMultiplier={1.35}>
        {name}
      </Text>
      {cellPhone ? <ContactLine label="Cell" value={cellPhone} kind="tel" /> : null}
      {workPhone ? <ContactLine label="Work" value={workPhone} kind="tel" /> : null}
      {email ? <ContactLine label="Email" value={email} kind="mailto" /> : null}
    </ProfileCard>
  );
}

/** Guardian 1 / 2 and the two emergency contacts. Titles vary per screen. */
export function ContactsList({
  contacts,
  titles = {
    g1: "Guardian 1",
    g2: "Guardian 2",
    inState: "In-State Emergency Contact",
    outOfState: "Out-of-State Emergency Contact",
  },
}: {
  contacts: StudentContacts;
  titles?: { g1: string; g2: string; inState: string; outOfState: string };
}) {
  return (
    <View style={{ gap: 12 }}>
      <ContactCard
        title={titles.g1}
        name={contacts.g1_full_name}
        relationship={contacts.g1_relationship}
        cellPhone={contacts.g1_cell_phone}
        workPhone={contacts.g1_work_phone}
        email={contacts.g1_email}
      />
      <ContactCard
        title={titles.g2}
        name={contacts.g2_full_name}
        relationship={contacts.g2_relationship}
        cellPhone={contacts.g2_cell_phone}
        workPhone={contacts.g2_work_phone}
        email={contacts.g2_email}
      />
      <ContactCard
        title={titles.inState}
        name={contacts.in_state_contact_name}
        relationship={contacts.in_state_contact_relation}
        cellPhone={contacts.in_state_contact_phone}
        emergency
      />
      <ContactCard
        title={titles.outOfState}
        name={contacts.out_of_state_contact_name}
        relationship={contacts.out_of_state_contact_relation}
        cellPhone={contacts.out_of_state_contact_phone}
        emergency
      />
    </View>
  );
}

/** Placeholder matching a ProfileCard while a tab loads. */
export function ProfileCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <GardenSkeleton width={32} height={32} radius={10} />
        <GardenSkeleton width="40%" height={16} radius={6} />
      </View>
      <View style={{ gap: 14 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <View key={i} style={{ gap: 6 }}>
            <GardenSkeleton width="28%" height={10} radius={5} />
            <GardenSkeleton width={i % 2 ? "50%" : "72%"} height={14} radius={6} />
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { ...gardenCard, borderRadius: 22, padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { flex: 1, fontFamily: GardenFonts.display, fontSize: 17, color: Garden.ink },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    color: Garden.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  value: { fontFamily: GardenFonts.bodySemi, fontSize: 15, color: Garden.ink, lineHeight: 21 },
  contactName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink },
  relation: {
    backgroundColor: GardenTints.sage.bg,
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  relationText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: GardenTints.sage.fg },
  line: { flexDirection: "row", alignItems: "center", gap: 8 },
  lineMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minHeight: MIN_TAP },
  lineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GardenTints.sage.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  link: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.sageDeep },
  copyBtn: {
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: MIN_TAP / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f1e7",
  },
});
