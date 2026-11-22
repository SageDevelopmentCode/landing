// Newsletters reader — Garden. Published issues, newest featured, then a
// two-column grid. Shared by the parent route ((tabs)/newsletters.tsx) and the
// staff route ((staff)/school-newsletters.tsx). Data in useParentNewsletters().
import { Garden, GardenScreenHero, GardenSpace, useRefreshFeedback } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import type { ReactNode } from "react";
import { FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useParentNewsletters } from "../useParentNewsletters";
import {
  CARD_GAP,
  FeaturedNewsletter,
  NewsletterCard,
  NewslettersEmpty,
  NewslettersError,
  NewslettersSkeleton,
} from "./NewslettersParts";
import { useNewsletterActions } from "./useNewsletterActions";

export function NewslettersReaderScreen({
  fallbackHref,
  heroRight,
}: {
  fallbackHref: string;
  /** Optional hero action (staff: jump to the newsletter editor). */
  heroRight?: ReactNode;
}) {
  const n = useParentNewsletters();
  const fb = useRefreshFeedback(n.reload);
  const actions = useNewsletterActions();
  const [latest, ...rest] = n.items;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <GardenScreenHero title="Newsletters" fallbackHref={fallbackHref} right={heroRight} />

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
