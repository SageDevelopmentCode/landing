import { Brand, FontFamilies } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import type { TeacherOption } from "./feedTypes";

interface TeacherFilterSheetProps {
  teachers: TeacherOption[];
  filterTeacherId: string | null;
  onSelect: (teacherId: string | null) => void;
}

export const TeacherFilterSheet = forwardRef<BottomSheetModal, TeacherFilterSheetProps>(
  ({ teachers, filterTeacherId, onSelect }, ref) => {
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["45%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <BottomSheetView style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Filter by Teacher</Text>
          <TouchableOpacity
            style={[styles.teacherRow, !filterTeacherId && styles.teacherRowActive]}
            onPress={() => onSelect(null)}
          >
            <View style={[styles.teacherAvatar, { backgroundColor: Brand.sage700 }]}>
              <Ionicons name="people" size={18} color="#fff" />
            </View>
            <Text style={styles.teacherName}>All Teachers</Text>
            {!filterTeacherId && <Ionicons name="checkmark" size={18} color={Brand.sage700} />}
          </TouchableOpacity>
          <FlatList
            data={teachers}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.teacherRow, filterTeacherId === item.id && styles.teacherRowActive]}
                onPress={() => onSelect(item.id)}
              >
                <AuthorAvatar name={item.full_name} userId={item.id} size={36} />
                <Text style={styles.teacherName}>{item.full_name}</Text>
                {filterTeacherId === item.id && (
                  <Ionicons name="checkmark" size={18} color={Brand.sage700} />
                )}
              </TouchableOpacity>
            )}
          />
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

TeacherFilterSheet.displayName = "TeacherFilterSheet";

const styles = StyleSheet.create({
  sheetContainer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, flex: 1 },
  sheetTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 14,
  },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  teacherRowActive: {
    backgroundColor: "#F2F7F3",
  },
  teacherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  teacherName: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
  },
});
