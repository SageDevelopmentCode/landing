// Additional Authorized Pickup (contract 7) — read-only Garden viewer.
// DL / State ID numbers are masked until the parent taps the eye.
import {
  Garden,
  GardenAvatar,
  GardenFonts,
  GardenIconButton,
  haptic,
} from "@/components/garden";
import {
  AUTHORIZED_PICKUP_CONTRACT_ID,
  SIGNATURE_AUTHORIZATION,
} from "@/features/forms/content/authorizedPickup";
import {
  fetchSignatures,
  formatDateOnly,
  maskId,
  MissingParamsError,
  unwrap,
} from "@/features/forms/formsUtils";
import {
  AcknowledgmentCard,
  FormCard,
  FormDetailScreen,
  FormEmpty,
  FormListHeading,
  InfoRow,
} from "@/features/forms/garden/FormParts";
import { useFormDetail } from "@/features/forms/useFormDetail";
import { useHideTabBar } from "@/features/forms/useHideTabBar";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface PickupPlan {
  id: string;
  date_of_request: string | null;
  effective_until: string | null;
}

interface PickupPerson {
  id: string;
  full_name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  dl_state_id_number: string | null;
  vehicle_info: string | null;
  license_plate_state: string | null;
  sort_order: number | null;
}

function MaskedIdRow({ value }: { value: string | null }) {
  const [revealed, setRevealed] = useState(false);
  if (!value) return <InfoRow label="ID Number" value={null} />;
  return (
    <InfoRow
      label="ID Number"
      value={revealed ? value : maskId(value)}
      right={
        <GardenIconButton
          icon={revealed ? "eye-off-outline" : "eye-outline"}
          label={revealed ? "Hide ID number" : "Show ID number"}
          tone="ghost"
          onPress={() => {
            haptic.select();
            setRevealed((r) => !r);
          }}
        />
      }
    />
  );
}

function PersonCard({ person }: { person: PickupPerson }) {
  return (
    <FormCard>
      <View style={st.personHead}>
        <GardenAvatar name={person.full_name} size={46} />
        <View style={{ flex: 1 }}>
          <Text style={st.name} maxFontSizeMultiplier={1.4}>
            {person.full_name}
          </Text>
          {person.relationship ? (
            <Text style={st.rel} maxFontSizeMultiplier={1.4}>
              {person.relationship}
            </Text>
          ) : null}
        </View>
      </View>
      <InfoRow label="Phone" value={person.phone} />
      <InfoRow label="Email" value={person.email} />
      <MaskedIdRow value={person.dl_state_id_number} />
      <InfoRow label="Vehicle Info" value={person.vehicle_info} />
      {person.license_plate_state ? (
        <InfoRow label="License Plate State" value={person.license_plate_state} />
      ) : null}
    </FormCard>
  );
}

export default function AuthorizedPickupScreen() {
  const { studentId, userId } = useLocalSearchParams<{ studentId: string; userId: string }>();
  useHideTabBar();

  const detail = useFormDetail(
    studentId && userId ? `${userId}:${studentId}` : null,
    async () => {
      if (!studentId || !userId) throw new MissingParamsError();
      const [planRes, personsRes, sigs] = await Promise.all([
        supabase
          .schema("parent_app")
          .from("student_authorized_pickup_plan")
          .select("id, date_of_request, effective_until")
          .eq("student_id", studentId)
          .eq("parent_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .schema("parent_app")
          .from("student_authorized_pickup_persons")
          .select(
            "id, full_name, relationship, phone, email, dl_state_id_number, vehicle_info, license_plate_state, sort_order",
          )
          .eq("student_id", studentId)
          .eq("parent_id", userId)
          .order("sort_order", { ascending: true }),
        fetchSignatures(studentId, userId, AUTHORIZED_PICKUP_CONTRACT_ID),
      ]);
      return {
        plan: unwrap(planRes) as PickupPlan | null,
        persons: (unwrap(personsRes) ?? []) as PickupPerson[],
        sig: sigs[0] ?? null,
      };
    },
    "parent-forms-authorized-pickup",
  );

  return (
    <FormDetailScreen title="Authorized Pickup" detail={detail} isEmpty={(d) => !d.plan}>
      {({ plan, persons, sig }) => (
        <>
          {plan && (plan.date_of_request || plan.effective_until) ? (
            <FormCard title="Plan Info">
              <InfoRow label="Date of Request" value={formatDateOnly(plan.date_of_request)} />
              <InfoRow label="Effective Until" value={formatDateOnly(plan.effective_until)} />
            </FormCard>
          ) : null}

          <FormListHeading>{`Authorized Persons (${persons.length})`}</FormListHeading>

          {persons.length === 0 ? (
            <FormEmpty title="No authorized pickup persons on file." body="" />
          ) : (
            persons.map((person) => <PersonCard key={person.id} person={person} />)
          )}

          <AcknowledgmentCard title="Authorization" text={SIGNATURE_AUTHORIZATION} sig={sig} />
        </>
      )}
    </FormDetailScreen>
  );
}

const st = StyleSheet.create({
  personHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 17, color: Garden.ink },
  rel: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.muted },
});
