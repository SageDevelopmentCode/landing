import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import type { ParticipationLevel } from "@/lib/activity-preferences";

const LEVEL_OPTIONS: { level: ParticipationLevel; emoji: string; label: string }[] = [
  { level: "watch", emoji: "👀", label: "Do not participate, just watch" },
  {
    level: "cook_no_eat",
    emoji: "🧑‍🍳",
    label: "Cook and interact with ingredients but do not consume",
  },
  { level: "full", emoji: "✅", label: "Okay for everything (cooking and eating)" },
];

const LEVEL_SHORT_LABEL: Record<ParticipationLevel, string> = {
  watch: "Watch",
  cook_no_eat: "Cook",
  full: "Full",
};

export type DefaultSaveStatus = "idle" | "saving" | "saved" | "error";

export function LevelSegmentedControl({
  value,
  onChange,
  disabled,
}: {
  value: ParticipationLevel | null;
  onChange: (level: ParticipationLevel | null) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.segmentedRow}>
      {LEVEL_OPTIONS.map((opt) => {
        const active = value === opt.level;
        return (
          <TouchableOpacity
            key={opt.level}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            onPress={() => onChange(active ? null : opt.level)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={styles.segmentEmoji}>{opt.emoji}</Text>
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {LEVEL_SHORT_LABEL[opt.level]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

type Props = {
  childName: string;
  currentDefault: ParticipationLevel | null;
  saveStatus: DefaultSaveStatus;
  onSetDefault: (level: ParticipationLevel | null) => void;
  disabled?: boolean;
  questionText?: string;
  initiallyExpanded?: boolean;
};

export function AutoFillPreferenceCard({
  childName,
  currentDefault,
  saveStatus,
  onSetDefault,
  disabled = false,
  questionText,
  initiallyExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  useEffect(() => {
    if (saveStatus === "saved" && currentDefault !== null) {
      setExpanded(false);
    }
  }, [saveStatus, currentDefault]);

  const statusText = useMemo(() => {
    if (saveStatus === "saving") return "Saving default…";
    if (saveStatus === "error") return "Something went wrong. Please try again.";
    if (saveStatus === "saved" && currentDefault !== null) {
      return `Default saved · ${LEVEL_SHORT_LABEL[currentDefault]}`;
    }
    if (saveStatus === "saved") return "Default cleared.";
    if (currentDefault !== null) {
      return `Default active · ${LEVEL_SHORT_LABEL[currentDefault]}`;
    }
    return null;
  }, [saveStatus, currentDefault]);

  const currentDefaultOption = LEVEL_OPTIONS.find((o) => o.level === currentDefault);
  const title = questionText ?? `What's ${childName}'s usual participation level?`;

  return (
    <View style={styles.autoFillCard}>
      <TouchableOpacity
        style={styles.autoFillHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <View style={styles.autoFillHeaderText}>
          <Text style={styles.autoFillQuestion}>{title}</Text>
          {!expanded ? (
            <Text style={styles.autoFillCollapsedSub}>
              {currentDefaultOption
                ? `${currentDefaultOption.emoji} ${LEVEL_SHORT_LABEL[currentDefault!]} · Default active`
                : "Not set · Tap to set a default for new activities"}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={expanded ? "chevron-down" : "chevron-forward"}
          size={18}
          color="#6b7280"
        />
      </TouchableOpacity>

      {expanded ? (
        <>
          <Text style={styles.autoFillDesc}>
            Saves immediately and pre-fills new activities.
          </Text>

          <LevelSegmentedControl
            value={currentDefault}
            onChange={(level) => {
              if (disabled) return;
              if (level === null) {
                if (currentDefault !== null) onSetDefault(null);
              } else if (level !== currentDefault) {
                onSetDefault(level);
              }
            }}
            disabled={disabled || saveStatus === "saving"}
          />

          {currentDefault !== null && saveStatus !== "saving" && !disabled ? (
            <TouchableOpacity
              style={styles.autoFillClearBtn}
              onPress={() => onSetDefault(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.autoFillClearText}>Clear default</Text>
            </TouchableOpacity>
          ) : null}

          {statusText ? (
            <Text
              style={[
                styles.autoFillStatus,
                saveStatus === "error" && styles.autoFillStatusError,
              ]}
            >
              {statusText}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  autoFillCard: {
    backgroundColor: "#f0f4f1",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d1dbd4",
    padding: Spacing.three,
    gap: 12,
    marginBottom: 4,
  },
  autoFillHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  autoFillHeaderText: {
    flex: 1,
    gap: 4,
  },
  autoFillQuestion: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
  },
  autoFillCollapsedSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  autoFillDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
  autoFillClearBtn: { alignSelf: "flex-start" },
  autoFillClearText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    textDecorationLine: "underline",
  },
  autoFillStatus: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#16a34a",
  },
  autoFillStatusError: { color: "#dc2626" },
  segmentedRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 4,
  },
  segmentBtnActive: {
    borderColor: Brand.sage700,
    backgroundColor: `${Brand.sage700}14`,
  },
  segmentEmoji: { fontSize: 16 },
  segmentLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#4b5563",
  },
  segmentLabelActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
});
