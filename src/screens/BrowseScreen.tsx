/**
 * Browse screen (second tab).
 *
 * Category filter + full restaurant list, plus a category-scoped ContentZone
 * ("browse_category_banner") whose decisionsRequestContext changes with the
 * selected cuisine — demonstrating context-driven refetch on the same zone.
 * Selecting a category fires a CustomEvent; a search submit fires another.
 */

import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContentZoneController } from '@salesforce-personalization/react-native-personalization';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BrowseStackParamList } from '../navigation/types';
import { restaurants, cuisines } from '../data/catalog';
import { colors, radius, spacing, typography } from '../theme';
import { RestaurantCard } from '../components/catalog';
import { LabeledContentZone } from '../components/LabeledContentZone';
import { PreviewBar } from '../components/PreviewBar';
import { forklyBanner } from '../personalization/zones';
import { trackCustom } from '../personalization/sdk';

type Nav = NativeStackNavigationProp<BrowseStackParamList>;

// Filter chips are derived from the real catalog cuisines (source of truth),
// so adding restaurants/cuisines to the data automatically updates Browse.
const CATEGORIES = ['All', ...cuisines] as const;

export default function BrowseScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = React.useState<(typeof CATEGORIES)[number]>('All');
  const [query, setQuery] = React.useState('');
  const bannerController = useContentZoneController();
  const [previewNonce, setPreviewNonce] = React.useState(0);

  const onPreviewApplied = React.useCallback(async () => {
    await bannerController.refresh(true);
    setPreviewNonce(n => n + 1);
  }, [bannerController]);

  const filtered = restaurants.filter(r => {
    const matchesCat = category === 'All' || r.cuisine === category;
    const matchesQuery =
      query.trim() === '' ||
      r.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCat && matchesQuery;
  });

  const bannerZone = React.useMemo(() => [forklyBanner()], []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={typography.title}>Browse</Text>
        <TextInput
          style={styles.search}
          placeholder="Search restaurants"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => trackCustom('forkly_search_submitted', { query })}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {CATEGORIES.map(c => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => {
                setCategory(c);
                trackCustom('forkly_category_selected', { category: c });
              }}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Preview any campaign targeting this screen's zone. */}
      <PreviewBar onApplied={onPreviewApplied} />

      {/* Category-scoped ContentZone: context changes with the filter. */}
      <LabeledContentZone
        name="browse_category_banner"
        allowedComponents={bannerZone}
        controller={bannerController}
        previewNonce={previewNonce}
        decisionsRequestContext={{
          anchorType: 'Category',
          anchorId: category,
          attributes: { category },
        }}
      />

      <View style={styles.list}>
        {filtered.map(r => (
          <RestaurantCard
            key={r.id}
            restaurant={r}
            onPress={() =>
              navigation.navigate('RestaurantDetail', { restaurantId: r.id })
            }
          />
        ))}
        {filtered.length === 0 ? (
          <Text style={[typography.caption, styles.empty]}>No matches.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, gap: spacing.md },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  chips: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.body, color: colors.text },
  chipTextActive: { color: colors.textInverse, fontWeight: '700' },
  list: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  empty: { textAlign: 'center', marginTop: spacing.xl },
});
