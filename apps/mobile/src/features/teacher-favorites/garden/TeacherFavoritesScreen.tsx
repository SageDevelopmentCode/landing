// Teacher Favorites screen body, shared by the parent route
// ((tabs)/teacher-favorites.tsx) and the staff route ((staff)/teacher-favorites.tsx).
import { Garden, GardenScreenHero, GardenSpace, HandNote } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTeacherFavorites } from "../useTeacherFavorites";
import { FavoritesBoard, TeacherPicker } from "./TeacherFavoritesParts";

export function TeacherFavoritesScreen({ fallbackHref }: { fallbackHref: string }) {
  const f = useTeacherFavorites();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <GardenScreenHero title="Teacher Favorites" fallbackHref={fallbackHref} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
      >
        <HandNote
          size={17}
          style={{ paddingHorizontal: GardenSpace.gutter, marginTop: -4, marginBottom: 12 }}
        >
          a little gift guide 🎁
        </HandNote>
        <TeacherPicker f={f} />
        <FavoritesBoard f={f} />
      </ScrollView>
    </SafeAreaView>
  );
}
