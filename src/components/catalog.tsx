/**
 * Catalog UI cards (restaurant + dish) reused across Home / Browse / detail
 * screens. Presentational only; navigation and event tracking are passed in.
 */

import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { MenuItem, Restaurant } from '../data/catalog';
import { colors, radius, spacing, typography } from '../theme';
import { Card, PrimaryButton } from './ui';

export function RestaurantCard({
  restaurant,
  onPress,
}: {
  restaurant: Restaurant;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.restaurantCard}>
      <Image source={{ uri: restaurant.imageUrl }} style={styles.restaurantImage} />
      <View style={styles.restaurantBody}>
        <View style={styles.rowBetween}>
          <Text style={typography.heading}>{restaurant.name}</Text>
          <Text style={styles.rating}>★ {restaurant.rating.toFixed(1)}</Text>
        </View>
        <Text style={typography.caption}>
          {restaurant.cuisine} · {restaurant.etaMinutes} min · $
          {restaurant.deliveryFee.toFixed(2)} delivery
        </Text>
        <View style={styles.tagRow}>
          {restaurant.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

export function DishCard({
  item,
  onPress,
  onAdd,
}: {
  item: MenuItem;
  onPress: () => void;
  onAdd?: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.dishCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.dishImage} />
      <View style={styles.dishBody}>
        <View style={styles.rowBetween}>
          <Text style={typography.body} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{item.category}</Text>
          </View>
        </View>
        <Text style={typography.caption} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.rowBetween}>
          <Text style={typography.price}>${item.price.toFixed(2)}</Text>
          {onAdd ? (
            <View style={styles.addButton}>
              <PrimaryButton label="Add" onPress={onAdd} />
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  restaurantCard: { marginBottom: spacing.md },
  restaurantImage: { width: '100%', height: 150 },
  restaurantBody: { padding: spacing.md, gap: spacing.xs },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rating: { ...typography.body, fontWeight: '700', color: colors.star },
  tagRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' },
  tag: {
    backgroundColor: colors.overlay,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: { ...typography.caption, fontSize: 11 },
  dishCard: { flexDirection: 'row', marginBottom: spacing.md },
  dishImage: { width: 96, height: 96 },
  dishBody: { flex: 1, padding: spacing.md, gap: spacing.xs, justifyContent: 'space-between' },
  addButton: { minWidth: 72 },
  categoryTag: {
    backgroundColor: colors.overlay,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  categoryTagText: { ...typography.caption, fontSize: 10, fontWeight: '700' },
});
