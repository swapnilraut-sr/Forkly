/**
 * Dish detail (two navigation levels deep: Home → Restaurant → Dish, or via a
 * personalized recommendation tap).
 *
 * Demonstrates:
 *   - A ContentZone this deep in the stack ("dish_pairings", Recommendations)
 *     biased via decisionsRequestContext toward the current dish.
 *   - CatalogEvent(viewDetail) on mount, CatalogEvent(favorite)/(share) from actions.
 *   - Add-to-cart driving CartEvent(add) through the cart context.
 */

import * as React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContentZoneController } from '@salesforce-personalization/react-native-personalization';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeStackParamList } from '../navigation/types';
import { getRestaurant, resolveMenuItem } from '../data/catalog';
import { colors, spacing, typography } from '../theme';
import { PrimaryButton } from '../components/ui';
import { LabeledContentZone } from '../components/LabeledContentZone';
import { PreviewBar } from '../components/PreviewBar';
import { forklyRecommendations } from '../personalization/zones';
import { trackCatalog } from '../personalization/sdk';
import { useCart } from '../context/CartContext';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'DishDetail'>;
type Rt = RouteProp<HomeStackParamList, 'DishDetail'>;

export default function DishDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const [favorited, setFavorited] = React.useState(false);
  const pairingsController = useContentZoneController();
  const [previewNonce, setPreviewNonce] = React.useState(0);

  // `itemId` may be an app-level id (`item-…`) or a Data Cloud Goods Product
  // Id when navigation originates from personalized content — resolve both.
  const item = resolveMenuItem(params.itemId);
  const restaurant = item ? getRestaurant(item.restaurantId) : undefined;

  const onPreviewApplied = React.useCallback(async () => {
    await pairingsController.refresh(true);
    setPreviewNonce(n => n + 1);
  }, [pairingsController]);

  React.useEffect(() => {
    if (item) {
      // Product CatalogEvents carry the Data Cloud Goods Product Id as the
      // catalog object id (NOT the app-level display id).
      trackCatalog('viewDetail', {
        type: 'product',
        id: item.goodsProductId,
        attributes: { name: item.name, category: item.category, price: item.price },
      });
    }
  }, [item]);

  const pairingsZone = React.useMemo(
    () =>
      [
        forklyRecommendations(event =>
          navigation.push('DishDetail', { itemId: event.item.id }),
        ),
      ],
    [navigation],
  );

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Dish not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
      <Image source={{ uri: item.imageUrl }} style={styles.hero} />
      <View style={styles.body}>
        <Text style={typography.title}>{item.name}</Text>
        {restaurant ? (
          <Text style={typography.caption}>{restaurant.name}</Text>
        ) : null}
        <Text style={[typography.body, styles.description]}>{item.description}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>

        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <PrimaryButton label="Add" onPress={() => cart.add(item)} />
          </View>
          <View style={styles.actionButton}>
            <PrimaryButton
              variant="secondary"
              label={favorited ? '♥ Saved' : '♡ Save'}
              onPress={() => {
                setFavorited(f => !f);
                trackCatalog(favorited ? 'view' : 'favorite', {
                  type: 'product',
                  id: item.goodsProductId,
                  attributes: { name: item.name },
                });
              }}
            />
          </View>
          <View style={styles.actionButton}>
            <PrimaryButton
              variant="secondary"
              label="Share"
              onPress={() =>
                trackCatalog('share', {
                  type: 'product',
                  id: item.goodsProductId,
                  attributes: { name: item.name },
                })
              }
            />
          </View>
          <View style={styles.actionButton}>
            <PrimaryButton
              variant="secondary"
              label="Preview"
              onPress={() =>
                trackCatalog('quickView', {
                  type: 'product',
                  id: item.goodsProductId,
                  attributes: { name: item.name },
                })
              }
            />
          </View>
          <View style={styles.actionButton}>
            <PrimaryButton
              variant="secondary"
              label="Review"
              onPress={() => {
                // Demonstrates the CatalogEvent 'review' and 'comment' subtypes.
                trackCatalog('review', {
                  type: 'product',
                  id: item.goodsProductId,
                  attributes: { name: item.name, rating: 5 },
                });
                trackCatalog('comment', {
                  type: 'product',
                  id: item.goodsProductId,
                  attributes: { name: item.name, comment: 'Delicious!' },
                });
              }}
            />
          </View>
        </View>
      </View>

      {/* Preview any campaign targeting this screen's zone. */}
      <PreviewBar onApplied={onPreviewApplied} />

      {/* Deepest ContentZone: pairings for this dish. A short timeoutSeconds
          demonstrates the ContentZone fetch-timeout path. */}
      <LabeledContentZone
        name="dish_pairings"
        allowedComponents={pairingsZone}
        controller={pairingsController}
        previewNonce={previewNonce}
        timeoutSeconds={5}
        decisionsRequestContext={{
          anchorId: item.goodsProductId,
          anchorType: 'Product',
          attributes: { category: item.category, cuisine: item.cuisine },
        }}
        loadingLabel="Great with…"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: 240 },
  body: { padding: spacing.lg, gap: spacing.sm },
  description: { color: colors.textMuted },
  price: { ...typography.title, color: colors.primary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  actionButton: { flexGrow: 1, flexBasis: '30%' },
});
