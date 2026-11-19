// Staff "New Channel" bottom sheet. The inbox owns the write + feedback and
// dismisses the sheet only on success, so a failure keeps what was typed.
import { Display, Garden, GardenButton, GardenField, GardenFonts, gardenSheetChrome } from "@/components/garden";
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const NewChannelSheet = forwardRef<
  BottomSheetModal,
  { creating: boolean; onCreate: (name: string, description: string) => void }
>(function NewChannelSheet({ creating, onCreate }, ref) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const descRef = useRef<TextInput>(null);
  const canCreate = !!name.trim() && !creating;

  return (
    <BottomSheetModal
      ref={ref}
      {...gardenSheetChrome}
      enableDynamicSizing
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={() => {
        setName("");
        setDescription("");
      }}
    >
      <BottomSheetView style={[st.body, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Display size={26}>New Channel</Display>

        <View style={st.block}>
          <Text style={st.label}>Channel Name</Text>
          <GardenField
            InputComponent={BottomSheetTextInput as never}
            value={name}
            onChangeText={setName}
            placeholder="e.g. announcements"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => descRef.current?.focus()}
            accessibilityLabel="Channel Name"
            icon="pricetag-outline"
          />
        </View>

        <View style={st.block}>
          <Text style={st.label}>
            Description <Text style={st.optional}>(optional)</Text>
          </Text>
          <GardenField
            ref={descRef}
            InputComponent={BottomSheetTextInput as never}
            value={description}
            onChangeText={setDescription}
            placeholder="What's this channel about?"
            multiline
            boxed
            style={{ minHeight: 72 }}
            accessibilityLabel="Description, optional"
          />
        </View>

        <View style={st.actions}>
          <GardenButton
            label="Cancel"
            tone="outline"
            onPress={() => (ref as React.RefObject<BottomSheetModal | null>)?.current?.dismiss()}
            style={{ flex: 1 }}
            fullWidth
          />
          <GardenButton
            label="Create"
            tone="coral"
            loading={creating}
            loadingLabel="Creating..."
            disabled={!canCreate}
            onPress={() => onCreate(name, description)}
            style={{ flex: 1.4 }}
            fullWidth
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const st = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },
  block: { gap: 6 },
  label: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.soft, marginLeft: 4 },
  optional: { fontFamily: GardenFonts.bodySemi, color: Garden.muted },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
});
