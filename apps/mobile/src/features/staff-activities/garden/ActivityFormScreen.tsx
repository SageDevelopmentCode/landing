// Garden "New / Edit Activity" in three clear steps:
//   ① Basic Info (title, description, photos)
//   ② When & who sees it (date, Draft/Published, Private/Public + what that means)
//   ③ Food (foods, photos, allergens, ingredients)
// Inline validation scrolls to the first problem; unsaved edits ask before
// leaving; a failed edit-load shows Retry instead of an empty form.
import {
  Display,
  Garden,
  GardenButton,
  GardenDateField,
  GardenEmpty,
  GardenErrorCard,
  GardenField,
  GardenFonts,
  GardenHintBox,
  GardenIconButton,
  GardenRadii,
  GardenSegmented,
  GardenSkeleton,
  GardenStepCard,
  GardenTints,
  HandNote,
  PressableScale,
  SeedProgress,
  haptic,
  useDiscardGuard,
  useToast,
} from "@/components/garden";
import { floatingTabBarStyle } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useActivityForm, type ActivityForm, type FoodDraft, type ImgItem } from "../useActivityForm";
import { formatActivityDate } from "./ActivitiesParts";

const GUTTER = 18;

export function ActivityFormScreen() {
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const f = useActivityForm(activityId);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const scrollRef = useRef<ScrollView>(null);
  const stepY = useRef<number[]>([0, 0, 0]);
  const saveRef = useRef<(() => Promise<void>) | null>(null);
  const [saved, setSaved] = useState(false);

  const guard = useDiscardGuard(f.dirty && !saved, {
    message: "You have unsaved changes.",
    fallbackHref: "/(staff)/activities",
  });

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  // Someone else's activity (or not found) can't be edited here.
  useEffect(() => {
    if (f.loadState !== "forbidden") return;
    Alert.alert("Can't edit this activity", "You can only edit activities you created.", [
      { text: "OK", onPress: () => guard.leave() },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per state
  }, [f.loadState]);

  const save = useCallback(async () => {
    haptic.press();
    const r = await f.save();
    if (r.ok) {
      setSaved(true);
      const live = r.activity.status === "published" && r.activity.visibility === "public";
      toast.show({
        tone: "success",
        title: r.created ? "Activity created" : "Changes saved",
        message: live ? `Families can see “${r.activity.title}” now.` : "Only staff can see it while it's a draft or private.",
      });
      guard.leave();
      return;
    }
    if (r.reason === "invalid") {
      haptic.error();
      const step = f.form.title.trim() ? 2 : 0;
      scrollRef.current?.scrollTo({ y: Math.max(0, stepY.current[step] - 8), animated: true });
      toast.show({ tone: "error", title: "Almost there", message: r.firstError });
      return;
    }
    toast.show({
      tone: "error",
      title: r.partial ? "Some parts didn't save" : "Couldn't save the activity",
      message: r.partial
        ? "It's saved as a private draft so nothing is lost. Tap Retry to finish."
        : r.error,
      action: { label: "Retry", onPress: () => void saveRef.current?.() },
      duration: 7000,
    });
  }, [f, toast, guard]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const title = f.isEdit ? "Edit Activity" : "New Activity";
  const v = f.form;
  const step1 = !!v.title.trim();
  const step2 = !!v.activityDate || v.status === "draft";
  const step3 = !v.includesFood || (v.foods.length > 0 && v.foods.every((x) => x.name.trim()));

  return (
    <SafeAreaView style={st.safe} edges={["top", "left", "right"]}>
      <View style={st.nav}>
        <GardenIconButton icon="chevron-back" label="Back" onPress={guard.back} disabled={f.saving} />
        <View style={{ flex: 1 }}>
          <Display size={24} numberOfLines={1}>
            {title}
          </Display>
          {f.loadState === "ready" ? (
            <HandNote size={15} color={Garden.muted}>
              {`${[step1, step2, step3].filter(Boolean).length} of 3 steps ready`}
            </HandNote>
          ) : null}
        </View>
        {f.loadState === "ready" ? <SeedProgress done={0} total={3} doneFlags={[step1, step2, step3]} /> : null}
      </View>

      {f.loadState === "loading" || f.loadState === "forbidden" ? (
        <View style={{ paddingHorizontal: GUTTER, gap: 14 }} accessibilityLabel="Loading activity">
          <GardenSkeleton width="100%" height={180} radius={24} />
          <GardenSkeleton width="100%" height={160} radius={24} />
        </View>
      ) : f.loadState === "error" ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenErrorCard title="We couldn't load this activity" onRetry={() => void f.retryLoad()} />
        </View>
      ) : f.loadState === "notFound" ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenEmpty emoji="🍂" title="Activity not found" actionLabel="Back" onAction={() => guard.leave()} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 24, gap: 14 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View onLayout={(e) => (stepY.current[0] = e.nativeEvent.layout.y)}>
              <BasicsStep f={f} done={step1} />
            </View>
            <View onLayout={(e) => (stepY.current[1] = e.nativeEvent.layout.y)}>
              <PublishStep f={f} done={step2} />
            </View>
            <View onLayout={(e) => (stepY.current[2] = e.nativeEvent.layout.y)}>
              <FoodStep f={f} />
            </View>
          </ScrollView>

          <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <GardenButton label="Cancel" tone="outline" onPress={guard.back} disabled={f.saving} style={{ flex: 1 }} />
            <GardenButton
              label={f.createdId && !f.isEdit ? "Finish saving" : "Save"}
              loading={f.saving}
              loadingLabel="Saving…"
              success={saved}
              successLabel="Saved"
              tone="coral"
              icon="checkmark"
              onPress={() => void save()}
              style={{ flex: 2 }}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// ─── ① Basic Info ────────────────────────────────────────────────────────────
function BasicsStep({ f, done }: { f: ActivityForm; done: boolean }) {
  const toast = useToast();
  const v = f.form;
  return (
    <GardenStepCard n={1} title="Basic Info" note="what's happening" state={done ? "done" : "active"}>
      <View style={{ gap: 6 }}>
        <GardenField
          placeholder="Activity title *"
          value={v.title}
          onChangeText={(t) => f.set("title", t)}
          containerStyle={f.errors.title ? st.fieldError : undefined}
          accessibilityLabel="Activity title, required"
          returnKeyType="next"
        />
        {f.errors.title ? <Text style={st.errorText}>{f.errors.title}</Text> : null}
      </View>
      <GardenField
        boxed
        multiline
        placeholder="Description (optional)"
        value={v.description}
        onChangeText={(t) => f.set("description", t)}
        style={{ minHeight: 84 }}
        accessibilityLabel="Description"
      />
      <View style={{ gap: 8 }}>
        <Label note={`${v.images.length} of ${f.photoLimit}`}>Photos</Label>
        <PhotoStrip
          items={v.images}
          size={84}
          canAdd={v.images.length < f.photoLimit}
          onAdd={async () => {
            const n = await f.addPhotos();
            if (n) haptic.success();
            else if (v.images.length >= f.photoLimit)
              toast.show({ tone: "info", title: "Limit reached", message: `You can add up to ${f.photoLimit} photos.` });
          }}
          onRemove={f.removePhoto}
          addLabel="Add photos"
        />
      </View>
    </GardenStepCard>
  );
}

// ─── ② When & who sees it ────────────────────────────────────────────────────
function PublishStep({ f, done }: { f: ActivityForm; done: boolean }) {
  const v = f.form;
  const live = v.status === "published" && v.visibility === "public";
  const currentYear = new Date().getFullYear();
  return (
    <GardenStepCard n={2} title="When & who sees it" state={done ? "done" : "active"}>
      <View style={{ gap: 8 }}>
        <Label>Activity Date</Label>
        <GardenDateField
          value={v.activityDate}
          onChange={(d) => f.set("activityDate", d)}
          placeholder="Select a date"
          modalTitle="Activity Date"
          allowClear
          minYear={currentYear - 1}
          maxYear={currentYear + 2}
        />
      </View>
      <View style={{ gap: 8 }}>
        <Label>Status</Label>
        <GardenSegmented
          accessibilityLabel="Status"
          value={v.status}
          onChange={f.setStatus}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ]}
        />
      </View>
      {v.status === "published" ? (
        <Animated.View entering={FadeIn.duration(180)} style={{ gap: 8 }}>
          <Label>Visibility</Label>
          <GardenSegmented
            accessibilityLabel="Visibility"
            value={v.visibility}
            onChange={(x) => f.set("visibility", x)}
            options={[
              { value: "private", label: "Private" },
              { value: "public", label: "Public" },
            ]}
          />
        </Animated.View>
      ) : null}
      {live && !v.activityDate ? (
        <GardenHintBox icon="alert-circle-outline" tone="coral">
          Add a date so families can set their child's preference for the day.
        </GardenHintBox>
      ) : live ? (
        <GardenHintBox icon="people-outline" tone="sage">
          {`Families will see this for ${formatActivityDate(v.activityDate, { weekday: "long", month: "long" })} and can set their child's preference.`}
        </GardenHintBox>
      ) : v.status === "published" ? (
        <GardenHintBox icon="lock-closed-outline">Private: only staff can see it. Switch to Public to share it with families.</GardenHintBox>
      ) : (
        <GardenHintBox icon="create-outline">Drafts are private. Choose Published when it's ready for families.</GardenHintBox>
      )}
    </GardenStepCard>
  );
}

// ─── ③ Food ──────────────────────────────────────────────────────────────────
function FoodStep({ f }: { f: ActivityForm }) {
  const v = f.form;
  const reduce = useReducedMotion();
  const toggleFood = (on: boolean) => {
    haptic.select();
    if (!on && v.foods.length > 0) {
      Alert.alert(
        "Turn off food?",
        `The ${v.foods.length} food${v.foods.length === 1 ? "" : "s"} you added won't be saved with this activity.`,
        [
          { text: "Keep food", style: "cancel" },
          { text: "Turn off", style: "destructive", onPress: () => f.set("includesFood", false) },
        ],
      );
      return;
    }
    f.set("includesFood", on);
    if (on && v.foods.length === 0) f.addFood();
  };
  return (
    <GardenStepCard
      n={3}
      title="Food"
      note="optional"
      state={!v.includesFood ? "active" : v.foods.length && v.foods.every((x) => x.name.trim()) ? "done" : "active"}
    >
      <View style={st.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={st.toggleLabel} maxFontSizeMultiplier={1.3}>
            Includes Food?
          </Text>
          <Text style={st.toggleSub} maxFontSizeMultiplier={1.3}>
            Add foods, ingredients, and allergen info
          </Text>
        </View>
        <Switch
          value={v.includesFood}
          onValueChange={toggleFood}
          trackColor={{ false: "#e3d9c8", true: Garden.sage }}
          thumbColor={Garden.white}
          accessibilityLabel="Includes Food?"
        />
      </View>

      {v.includesFood ? (
        <>
          {f.errors.noFoods ? <Text style={st.errorText}>{f.errors.noFoods}</Text> : null}
          {v.foods.map((food, i) => (
            <Animated.View
              key={food.localId}
              entering={reduce ? undefined : FadeIn.duration(180)}
              exiting={reduce ? undefined : FadeOut.duration(140)}
              layout={reduce ? undefined : LinearTransition}
            >
              <FoodEditor f={f} food={food} index={i} />
            </Animated.View>
          ))}
          <PressableScale
            onPress={() => {
              f.addFood();
              haptic.success();
            }}
            accessibilityLabel="Add Food"
            style={st.addFood}
          >
            <Ionicons name="add-circle-outline" size={20} color={Garden.sageDeep} />
            <Text style={st.addFoodText}>Add Food</Text>
          </PressableScale>
        </>
      ) : null}
    </GardenStepCard>
  );
}

function FoodEditor({ f, food, index }: { f: ActivityForm; food: FoodDraft; index: number }) {
  const nameErr = f.errors.foodName[food.localId];
  return (
    <View style={st.foodCard}>
      <View style={st.foodHead}>
        <Text style={st.foodLabel}>{`🍽️  Food ${index + 1}`}</Text>
        <PressableScale
          haptics="tap"
          onPress={() =>
            Alert.alert("Remove food?", "This will remove the food and its ingredients.", [
              { text: "Cancel", style: "cancel" },
              { text: "Remove", style: "destructive", onPress: () => f.removeFood(food.localId) },
            ])
          }
          accessibilityLabel={`Remove Food ${index + 1}`}
          hitSlop={10}
          style={{ padding: 4 }}
        >
          <Ionicons name="trash-outline" size={18} color={Garden.coralDeep} />
        </PressableScale>
      </View>
      <GardenField
        placeholder="Food name"
        value={food.name}
        onChangeText={(t) => f.updateFood(food.localId, { name: t })}
        containerStyle={nameErr ? st.fieldError : undefined}
        accessibilityLabel={`Food ${index + 1} name`}
      />
      {nameErr ? <Text style={st.errorText}>{nameErr}</Text> : null}

      <Label>Food Photos</Label>
      <PhotoStrip
        items={food.images}
        size={64}
        canAdd
        onAdd={async () => {
          if (await f.addFoodPhoto(food.localId)) haptic.success();
        }}
        onRemove={(key) => f.removeFoodPhoto(food.localId, key)}
        addLabel={`Add a photo of ${food.name || `Food ${index + 1}`}`}
      />

      <GardenField
        boxed
        multiline
        icon="warning-outline"
        placeholder="Allergens / safety notes (optional)"
        value={food.allergens}
        onChangeText={(t) => f.updateFood(food.localId, { allergens: t })}
        accessibilityLabel="Allergens or safety notes"
      />

      <Label note={food.ingredients.length ? `${food.ingredients.length}` : undefined}>Ingredients</Label>
      {food.ingredients.map((ing) => {
        const err = f.errors.ingredientName[ing.localId];
        return (
          <View key={ing.localId} style={{ gap: 4 }}>
            <View style={st.ingRow}>
              <PressableScale
                onPress={async () => {
                  if (await f.pickIngredientPhoto(food.localId, ing.localId)) haptic.success();
                }}
                accessibilityLabel={ing.image ? "Change ingredient photo" : "Add ingredient photo"}
                style={st.ingImg}
              >
                {ing.image ? (
                  <Image source={{ uri: ing.image.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Ionicons name="camera-outline" size={18} color={Garden.sageDeep} />
                )}
              </PressableScale>
              <GardenField
                placeholder="Ingredient name"
                value={ing.name}
                onChangeText={(t) => f.updateIngredient(food.localId, ing.localId, { name: t })}
                containerStyle={[{ flex: 1 }, err ? st.fieldError : null]}
                accessibilityLabel="Ingredient name"
              />
              <PressableScale
                haptics="tap"
                onPress={() => f.removeIngredient(food.localId, ing.localId)}
                accessibilityLabel={`Remove ${ing.name || "ingredient"}`}
                hitSlop={10}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={22} color={Garden.muted} />
              </PressableScale>
            </View>
            {err ? <Text style={st.errorText}>{err}</Text> : null}
          </View>
        );
      })}
      <PressableScale
        haptics="tap"
        onPress={() => f.addIngredient(food.localId)}
        accessibilityLabel="Add Ingredient"
        style={st.addIng}
      >
        <Ionicons name="add" size={18} color={Garden.sageDeep} />
        <Text style={st.addIngText}>Add Ingredient</Text>
      </PressableScale>
    </View>
  );
}

// ─── Bits ────────────────────────────────────────────────────────────────────
function Label({ children, note }: { children: string; note?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
      <Text style={st.label} maxFontSizeMultiplier={1.3}>
        {children}
      </Text>
      {note ? (
        <HandNote size={15} color={Garden.muted}>
          {note}
        </HandNote>
      ) : null}
    </View>
  );
}

function PhotoStrip({
  items,
  size,
  canAdd,
  onAdd,
  onRemove,
  addLabel,
}: {
  items: ImgItem[];
  size: number;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: (key: string) => void;
  addLabel: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {items.map((img, i) => (
        <View key={img.key} style={[st.photo, { width: size, height: size }]}>
          {img.uri ? (
            <Image source={{ uri: img.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Ionicons name="image-outline" size={18} color={Garden.muted} />
          )}
          <PressableScale
            haptics="tap"
            onPress={() => onRemove(img.key)}
            accessibilityLabel={`Remove photo ${i + 1}`}
            hitSlop={8}
            style={st.photoRemove}
          >
            <Ionicons name="close" size={12} color={Garden.white} />
          </PressableScale>
        </View>
      ))}
      {canAdd ? (
        <PressableScale onPress={onAdd} accessibilityLabel={addLabel} style={[st.photoAdd, { width: size, height: size }]}>
          <Ionicons name="add" size={22} color={Garden.sageDeep} />
        </PressableScale>
      ) : null}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  nav: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingVertical: 10 },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  fieldError: { borderColor: Garden.coralDeep },
  errorText: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, color: Garden.danger, marginLeft: 12 },
  photo: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f1e7d8",
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(43,42,38,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAdd: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Garden.sage,
    backgroundColor: "#f4f9f5",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48 },
  toggleLabel: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink },
  toggleSub: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.muted, marginTop: 1 },
  foodCard: {
    gap: 10,
    padding: 14,
    borderRadius: GardenRadii.md,
    backgroundColor: GardenTints.peach.bg,
    borderWidth: 1,
    borderColor: "#f7d6c2",
  },
  foodHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  foodLabel: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: GardenTints.peach.fg },
  ingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ingImg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
    alignItems: "center",
    justifyContent: "center",
  },
  addIng: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40, alignSelf: "flex-start", paddingHorizontal: 4 },
  addIngText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.sageDeep },
  addFood: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: GardenRadii.sm + 2,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Garden.sage,
    backgroundColor: "#f4f9f5",
  },
  addFoodText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.sageDeep },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
});
