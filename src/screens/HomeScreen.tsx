/**
 * Home screen.
 *
 * The personalization showcase. It renders MULTIPLE ContentZones on one screen:
 *   - "Promo_Card"              custom PromoCard component (live, wire name "promocard")
 *   - "home_chef_spotlight"     custom DishSpotlight component (live, PerAction engagement)
 *   - "home_featured"           custom FeaturedCarousel (live, PerItemAndAction engagement)
 *   - "Product_Recommendations" custom ProductRecs horizontal rail (live, wire name "productrecommendations", PerItemAndAction)
 *   - "home_mock_promo"         MockContentZone / Banner (no backend — always renders)
 *   - "home_mock_recs"          MockContentZone / Recommendations (no backend)
 *
 * Pull-to-refresh drives all live + mock zones via shared controllers. There is
 * also a consent toggle in the top-right (opt in / opt out) and a preview URL
 * bar so a reviewer can preview any campaign targeting this screen's zones.
 */

import * as React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContentZoneController } from '@salesforce-personalization/react-native-personalization';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { LabeledContentZone, LabeledMockContentZone } from '../components/LabeledContentZone';
import { PreviewBar } from '../components/PreviewBar';
import {
  forklyBanner,
  forklyFeatured,
  forklyFeaturedFallback,
  forklyProductRecs,
  forklyPromo,
  forklyRecommendations,
  forklySpotlight,
  forklySpotlightFallback,
  mockBannerContent,
  mockRecommendationsContent,
} from '../personalization/zones';
import { restaurants } from '../data/catalog';
import { RestaurantCard } from '../components/catalog';
import { ScreenSection } from '../components/ui';
import { setConsent, trackCustom } from '../personalization/sdk';
import { useSession } from '../context/PersonalizationContext';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

// Deep-link targets embedded in personalized CTAs look like forkly://dish/<id>
// or forkly://restaurant/<id>. Resolve them to navigation actions.
function useContentNavigation() {
  const navigation = useNavigation<Nav>();
  return React.useCallback(
    (url?: string) => {
      if (!url) {
        return;
      }
      const dishMatch = url.match(/dish\/([\w-]+)/);
      const restMatch = url.match(/restaurant\/([\w-]+)/);
      if (dishMatch) {
        navigation.navigate('DishDetail', { itemId: dishMatch[1] });
      } else if (restMatch) {
        navigation.navigate('RestaurantDetail', { restaurantId: restMatch[1] });
      }
    },
    [navigation],
  );
}

/** Small opt-in/opt-out consent control shown in the top-right of the header. */
function ConsentToggle() {
  const session = useSession();
  const optedIn = session.consentOptIn === true;

  const onToggle = React.useCallback(
    async (next: boolean) => {
      await setConsent(next);
      await session.refreshConsent();
    },
    [session],
  );

  return (
    <View style={styles.consent}>
      <Text style={styles.consentLabel}>
        Personalization{'\n'}
        <Text style={styles.consentState}>
          {session.consentOptIn === null
            ? 'not set'
            : optedIn
              ? 'On'
              : 'Off'}
        </Text>
      </Text>
      <Switch
        value={optedIn}
        onValueChange={onToggle}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const navigateToContent = useContentNavigation();

  // One controller per zone so pull-to-refresh (and preview) can refetch them.
  const heroController = useContentZoneController();
  const spotlightController = useContentZoneController();
  const featuredController = useContentZoneController();
  const recsController = useContentZoneController();
  const mockPromoController = useContentZoneController();
  const mockRecsController = useContentZoneController();
  const [refreshing, setRefreshing] = React.useState(false);
  const [previewNonce, setPreviewNonce] = React.useState(0);

  const refreshAll = React.useCallback(
    (withLoadingState: boolean) =>
      Promise.all([
        heroController.refresh(withLoadingState),
        spotlightController.refresh(withLoadingState),
        featuredController.refresh(withLoadingState),
        recsController.refresh(withLoadingState),
        mockPromoController.refresh(withLoadingState),
        mockRecsController.refresh(withLoadingState),
      ]),
    [
      heroController,
      spotlightController,
      featuredController,
      recsController,
      mockPromoController,
      mockRecsController,
    ],
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    trackCustom('forkly_home_pull_to_refresh');
    try {
      // Silent refresh — content stays visible while refetching. The zone
      // refreshes can resolve almost instantly (mock/cached content), which
      // would flip `refreshing` off within a frame and the spinner would never
      // paint. Hold it for a minimum duration so the spinner is actually seen.
      await Promise.all([
        refreshAll(true),
        new Promise<void>(resolve => setTimeout(() => resolve(), 800)),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  // Called after a preview URL is applied: force a loading-visible refresh so
  // zones visibly reload into preview content, and re-check the PREVIEW badges.
  const onPreviewApplied = React.useCallback(async () => {
    await refreshAll(true);
    setPreviewNonce(n => n + 1);
  }, [refreshAll]);

  // Promo_Card now renders a custom, food-app-themed PromoCard (wire name
  // "promocard") instead of the OOTB Banner.
  const promoZone = React.useMemo(
    () => [forklyPromo((_model, ctaUrl) => navigateToContent(ctaUrl))],
    [navigateToContent],
  );
  const spotlightZone = React.useMemo(
    () => [forklySpotlight((_model, ctaUrl) => navigateToContent(ctaUrl))],
    [navigateToContent],
  );
  const featuredZone = React.useMemo(
    () => [forklyFeatured(item => navigateToContent(item.url))],
    [navigateToContent],
  );

  // Sample content shown when these zones have no live Data Cloud campaign yet,
  // so the home screen still looks complete (a valid alternate, not an error).
  const goToDish = React.useCallback(
    (item: { id: string }) =>
      navigation.navigate('DishDetail', { itemId: item.id }),
    [navigation],
  );
  const spotlightFallback = React.useMemo(
    () => forklySpotlightFallback(goToDish),
    [goToDish],
  );
  const featuredFallback = React.useMemo(
    () => forklyFeaturedFallback(goToDish),
    [goToDish],
  );
  // Product_Recommendations now renders a custom, food-app-themed horizontal
  // product rail (ProductRecs) instead of the OOTB vertical Recommendations.
  // Tapping a product opens its PDP (DishDetail), where it can be added to the
  // cart. Prefer the item id (DishDetail resolves either the app-level id or a
  // Goods Product Id); fall back to the CTA deep link.
  const recsZone = React.useMemo(
    () => [
      forklyProductRecs(item => {
        if (item.id) {
          navigation.navigate('DishDetail', { itemId: item.id });
        } else {
          navigateToContent(item.url);
        }
      }),
    ],
    [navigation, navigateToContent],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          // The ScrollView starts at y=0 (behind the status bar / notch); the
          // hero fakes the safe area with paddingTop. Offset the spinner by the
          // top inset so it renders below the notch instead of clipped under it.
          progressViewOffset={insets.top}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }>
      <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.heroText}>
          <Text style={styles.greeting}>Good evening 👋</Text>
          <Text style={styles.heroTitle}>What are you craving?</Text>
        </View>
        <ConsentToggle />
      </View>

      {/* Preview any campaign targeting this screen's zones. */}
      <PreviewBar onApplied={onPreviewApplied} />

      {/* Zone 1: custom PromoCard (live) — wire name "promocard" */}
      <LabeledContentZone
        name="Promo_Card"
        allowedComponents={promoZone}
        controller={heroController}
        previewNonce={previewNonce}
      />

      {/* Zone 2: Custom single-element component (live, PerAction engagement) */}
      <LabeledContentZone
        name="home_chef_spotlight"
        allowedComponents={spotlightZone}
        controller={spotlightController}
        previewNonce={previewNonce}
        fallbackContent={spotlightFallback}
      />

      {/* Zone 3: Custom list component (live, PerItemAndAction engagement) */}
      <LabeledContentZone
        name="home_featured"
        allowedComponents={featuredZone}
        controller={featuredController}
        previewNonce={previewNonce}
        fallbackContent={featuredFallback}
      />

      {/* Zone 4: custom ProductRecs — horizontal product rail (live) */}
      <LabeledContentZone
        name="Product_Recommendations"
        allowedComponents={recsZone}
        controller={recsController}
        previewNonce={previewNonce}
      />

      {/* Zone 5: MockContentZone / Banner — renders offline, refreshable. */}
      <LabeledMockContentZone
        name="home_mock_promo"
        allowedComponents={[forklyBanner(event => navigateToContent(event.ctaUrl))]}
        mockContent={mockBannerContent}
        mockLoadingSeconds={0.6}
        controller={mockPromoController}
      />

      {/* Zone 6: MockContentZone / Recommendations — renders offline. */}
      <LabeledMockContentZone
        name="home_mock_recs"
        allowedComponents={[forklyRecommendations(event => navigateToContent(event.item.url))]}
        mockContent={mockRecommendationsContent}
        mockLoadingSeconds={0.6}
        controller={mockRecsController}
      />

      <ScreenSection title="Top restaurants" subtitle="Hand-picked spots near you">
        {restaurants.map(r => (
          <RestaurantCard
            key={r.id}
            restaurant={r}
            onPress={() => {
              trackCustom('forkly_restaurant_opened', { restaurantId: r.id, source: 'home' });
              navigation.navigate('RestaurantDetail', { restaurantId: r.id });
            }}
          />
        ))}
      </ScreenSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroText: { flex: 1 },
  greeting: { ...typography.caption },
  heroTitle: { ...typography.title, marginTop: spacing.xs },
  consent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  consentLabel: { ...typography.caption, fontSize: 11, textAlign: 'right' },
  consentState: { fontWeight: '800', color: colors.text },
});
