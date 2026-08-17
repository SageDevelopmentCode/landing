import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { Brand, FontFamilies } from "@/constants/theme";
import { TeacherIdCard } from "@/components/TeacherIdCard";
import type { TeacherIdCard as TeacherIdCardType } from "@/lib/teacher-id-actions";

type Props = {
  card: TeacherIdCardType | null;
  onManage: () => void;
  onDismiss?: () => void;
};

export const TeacherIdPreviewSheet = forwardRef<BottomSheetModal, Props>(
  function TeacherIdPreviewSheet({ card, onManage, onDismiss }, ref) {
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["92%"]}
        enablePanDownToClose
        onDismiss={onDismiss}
        handleIndicatorStyle={styles.handle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        {card && (
          <BottomSheetView style={styles.container}>
            <View style={styles.cardWrap}>
              <TeacherIdCard card={card} size="preview" />
            </View>

            <Pressable style={styles.manageBtn} onPress={onManage}>
              <Ionicons name="settings-outline" size={18} color="#fff" />
              <Text style={styles.manageBtnText}>Manage ID</Text>
            </Pressable>
          </BottomSheetView>
        )}
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  handle: {
    backgroundColor: "#d1d5db",
    width: 36,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  cardWrap: {
    alignItems: "center",
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Brand.sage700,
    alignSelf: "stretch",
    maxWidth: 320,
  },
  manageBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#fff",
  },
});
