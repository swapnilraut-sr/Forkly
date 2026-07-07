/**
 * Restaurant detail (one navigation level deep).
 *
 * Demonstrates:
 *   - A ContentZone nested inside a pushed stack screen ("restaurant_recommendations")
 *   - `decisionsRequestContext` to bias personalization toward this restaurant
 *     (anchorId / anchorType / attributes)
 *   - CatalogEvent(view) on screen focus, and tap-through into DishDetail
 */

import * as React from 'react';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContentZoneController } from '@salesforce-personalization/react-native-personalization';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeStackParamList } from '../navigation/types';
import { getMenuForRestaurant, getRestaurant } from '../data/catalog';
import { colors, spacing, typography } from '../theme';
import { DishCard } from '../components/catalog';
import { ScreenSection, Pill } from '../components/ui';
import { LabeledContentZone } from '../components/LabeledContentZone';
import { PreviewBar } from '../components/PreviewBar';
import { forklyRecommendations } from '../personalization/zones';
import { trackCatalog, trackCustom } from '../personalization/sdk';
import { useCart } from '../context/CartContext';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'RestaurantDetail'>;
type Rt = RouteProp<HomeStackParamList, 'RestaurantDetail'>;

export default function RestaurantDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const cart = useCart();

  const restaurant = getRestaurant(params.restaurantId);
  const menu = getMenuForRestaurant(params.restaurantId);
  const recsController = useContentZoneController();
  const [previewNonce, setPreviewNonce] = React.useState(0);

  const onPreviewApplied = React.useCallback(async () => {
    await recsController.refresh(true);
    setPreviewNonce(n => n + 1);
  }, [recsController]);

  React.useEffect(() => {
    if (restaurant) {
      // CatalogEvent(view) for the restaurant entity.
      trackCatalog('view', {
        type: 'restaurant',
        id: restaurant.id,
        attributes: { name: restaurant.name, cuisine: restaurant.cuisine },
      });
    }
  }, [restaurant]);

  const recsZone = React.useMemo(
    () =>
      [
        forklyRecommendations(event =>
          navigation.navigate('DishDetail', { itemId: event.item.id }),
        ),
      ],
    [navigation],
  );

  if (!restaurant) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Restaurant not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
      <Image source={{ uri: restaurant.imageUrl }} style={styles.hero} />
      <View style={styles.headerBody}>
        <Text style={typography.title}>{restaurant.name}</Text>
        <Text style={typography.caption}>
          {restaurant.cuisine} · ★ {restaurant.rating.toFixed(1)} ·{' '}
          {restaurant.etaMinutes} min
        </Text>
        <View style={styles.pillRow}>
          {restaurant.tags.map(t => (
            <Pill key={t} text={t} />
          ))}
        </View>
      </View>

      {/* Preview any campaign targeting this screen's zone. */}
      <PreviewBar onApplied={onPreviewApplied} />

      {/* Nested ContentZone, biased toward this restaurant via context. */}
      <LabeledContentZone
        name="restaurant_recommendations"
        allowedComponents={recsZone}
        controller={recsController}
        previewNonce={previewNonce}
        decisionsRequestContext={{
          anchorId: restaurant.id,
          anchorType: 'Restaurant',
          attributes: { cuisine: restaurant.cuisine },
        }}
        loadingLabel="Finding dishes you'll love…"
      />

      <ScreenSection title="Menu">
        {menu.map(item => (
          <DishCard
            key={item.id}
            item={item}
            onPress={() => {
              trackCustom('forkly_dish_opened', { itemId: item.id, source: 'restaurant' });
              navigation.navigate('DishDetail', { itemId: item.id });
            }}
            onAdd={() => cart.add(item)}
          />
        ))}
      </ScreenSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: 200 },
  headerBody: { padding: spacing.lg, gap: spacing.xs },
  pillRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
});
