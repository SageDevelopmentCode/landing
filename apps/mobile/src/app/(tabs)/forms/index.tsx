// Parent Forms & Docs — Garden. Data lives in useFormsIndex(); the Garden
// pieces live in src/features/forms/garden/.
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import {
  ChildSwitcher,
  DocumentList,
  FormsHero,
  FormsIndexError,
  FormsIndexSkeleton,
  NoChildren,
} from "@/features/forms/garden/FormsIndexParts";
import { useFormsFeedback } from "@/features/forms/garden/useFormsFeedback";
import { useFormsIndex } from "@/features/forms/useFormsIndex";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FormsHomeScreen() {
  const c = useFormsIndex();
  const fb = useFormsFeedback(c.reload, c.retry);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        refreshControl={
          c.loading ? undefined : (
            <RefreshControl
              refreshing={fb.refreshing}
              onRefresh={() => void fb.refresh()}
              tintColor={Garden.sage}
            />
          )
        }
      >
        <FormsHero />
        {c.loading ? (
          <FormsIndexSkeleton />
        ) : c.error ? (
          <FormsIndexError fb={fb} />
        ) : c.children.length === 0 ? (
          <NoChildren />
        ) : (
          <>
            <ChildSwitcher c={c} />
            <DocumentList c={c} fb={fb} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
