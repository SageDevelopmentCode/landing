// Parent Newsletters — Garden. Data lives in useParentNewsletters(); the
// Garden pieces live in src/features/newsletters/garden/.
import { Garden, GardenScreenHero, GardenSpace, useRefreshFeedback } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import {
  CARD_GAP,
  FeaturedNewsletter,
  NewsletterCard,
  NewslettersEmpty,
  NewslettersError,
  NewslettersSkeleton,
} from "@/features/newsletters/garden/NewslettersParts";
import { useNewsletterActions } from "@/features/newsletters/garden/useNewsletterActions";
import { useParentNewsletters } from "@/features/newsletters/useParentNewsletters";
import { FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewslettersScreen() {
  const n = useParentNewsletters();
  const fb = useRefreshFeedback(n.reload);
  const actions = useNewsletterActions();
  const [latest, ...rest] = n.items;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <GardenScreenHero title="Newsletters" />

      {n.loading ? (
        <NewslettersSkeleton />
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: BottomTabInset + 24, gap: CARD_GAP }}
          columnWrapperStyle={{ gap: CARD_GAP, paddingHorizontal: GardenSpace.gutter }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {n.error ? <NewslettersError fb={fb} /> : null}
              {latest ? <FeaturedNewsletter item={latest} actions={actions} /> : null}
            </>
          }
          ListEmptyComponent={!latest && !n.error ? <NewslettersEmpty /> : null}
          refreshControl={
            <RefreshControl
              refreshing={fb.refreshing}
              onRefresh={() => void fb.refresh()}
              tintColor={Garden.sage}
            />
          }
          renderItem={({ item, index }) => (
            <NewsletterCard item={item} index={index} actions={actions} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
