/**
 * ProductRecs — a custom, food-app-themed recommendations rail.
 *
 * Replaces the OOTB `Recommendations` component (a vertical list) on the Home
 * screen's "Product_Recommendations" zone with a horizontally-scrolling product
 * carousel styled to match Forkly. Each card shows the product image, name, a
 * price/description line, and a small "Order" CTA chip.
 *
 * Its wire `name` is `"productrecommendations"` (the backend transformer match
 * name for this zone). It receives Recommendations-shaped list payloads
 * (`PerItemAndAction` engagement), renders our own layout, and fires the
 * automatic per-item View/Click engagement via the public helpers.
 *
 * Payload shape (Recommendations-compatible so existing campaigns keep working):
 *   { sectionHeader?, ctaText?, items: [{ id, name, description?, imageUrl, url?, price? }] }
 */

import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  type Component,
  type ComponentModel,
  type ComponentContext,
  type ContentSource,
  getPayloadForItemAndAction,
  trackEngagement,
} from '@salesforce-personalization/react-native-personalization';
import { colors, radius, spacing } from '../../theme';
import { logCall } from '../../personalization/eventLog';

export interface ProductRecItem {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  url?: string;
  /** Optional price; rendered as a chip when present. */
  price?: number;
  /** Allow arbitrary extra fields from the backend payload. */
  [key: string]: unknown;
}

export interface ProductRecsModel extends ComponentModel {
  sectionHeader?: string;
  ctaText?: string;
  items: ProductRecItem[];
}

type ProductRecsConfig = {
  onTap?: (item: ProductRecItem, index: number) => void;
};

/**
 * Backend transformer match name for this zone's content.
 * REQUIRED: must be "productrecommendations".
 */
const WIRE_NAME = 'productrecommendations';

export function ProductRecs(
  config: ProductRecsConfig = {},
): Component<ProductRecsModel> {
  return {
    name: WIRE_NAME,

    validateAndCreateComponentModel(json: string): ProductRecsModel {
      const raw = JSON.parse(json) as Partial<ProductRecsModel>;
      if (!Array.isArray(raw.items) || raw.items.length === 0) {
        throw new Error('ProductRecs requires a non-empty "items" array');
      }
      // Enforce the fields we render on each item.
      raw.items.forEach((item, i) => {
        if (!item || typeof item.name !== 'string' || !item.name) {
          throw new Error(`ProductRecs item[${i}] requires a "name"`);
        }
        if (typeof item.imageUrl !== 'string' || !item.imageUrl) {
          throw new Error(`ProductRecs item[${i}] requires an "imageUrl"`);
        }
      });
      return {
        sectionHeader: raw.sectionHeader,
        ctaText: raw.ctaText,
        items: raw.items as ProductRecItem[],
      };
    },

    compose(model: ProductRecsModel, context: ComponentContext) {
      return (
        <ProductRecsView model={model} context={context} onTap={config.onTap} />
      );
    },
  };
}

/** Build a short price/description subtitle for a card. */
function subtitle(item: ProductRecItem): string | undefined {
  if (item.description) {
    return item.description;
  }
  return typeof item.price === 'number'
    ? `$${item.price.toFixed(2)}`
    : undefined;
}

function ProductRecsView({
  model,
  context,
  onTap,
}: {
  model: ProductRecsModel;
  context: ComponentContext;
  onTap?: (item: ProductRecItem, index: number) => void;
}) {
  const source: ContentSource = context.contentSource;

  // Fire a per-item "View" engagement for each rendered item when a new
  // personalization instance arrives. Only PRODUCTION content carries payloads.
  React.useEffect(() => {
    if (
      source === 'PRODUCTION' &&
      context.engagementPayloads?.type === 'PerItemAndAction'
    ) {
      model.items.forEach((_item, index) => {
        const payload = getPayloadForItemAndAction(
          context.engagementPayloads!,
          index,
          'View',
        );
        if (payload) {
          trackEngagement(payload);
        }
      });
      logCall('engagement', 'ProductRecs View x' + model.items.length, {
        source,
      });
    }
  }, [context.personalizationId, source, context.engagementPayloads, model.items]);

  const handlePress = (item: ProductRecItem, index: number) => {
    if (
      source === 'PRODUCTION' &&
      context.engagementPayloads?.type === 'PerItemAndAction'
    ) {
      const payload = getPayloadForItemAndAction(
        context.engagementPayloads,
        index,
        'Click',
      );
      if (payload) {
        trackEngagement(payload);
        logCall('engagement', 'ProductRecs Click', { index, source });
      }
    }
    onTap?.(item, index);
  };

  const ctaLabel = model.ctaText ?? 'Order';

  return (
    <View>
      {model.sectionHeader ? (
        <Text style={styles.header}>{model.sectionHeader}</Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {model.items.map((item, index) => {
          const sub = subtitle(item);
          return (
            <Pressable
              key={item.id ?? String(index)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => handlePress(item, index)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}. ${ctaLabel}`}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
                {typeof item.price === 'number' ? (
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagText}>
                      ${item.price.toFixed(0)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              {sub ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {sub}
                </Text>
              ) : null}
              <View style={styles.cta}>
                <Text style={styles.ctaText}>{ctaLabel}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 168;

const styles = StyleSheet.create({
  header: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  row: { gap: spacing.md, paddingHorizontal: spacing.xs, paddingBottom: spacing.xs },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingBottom: spacing.md,
  },
  cardPressed: { opacity: 0.92 },
  imageWrap: { position: 'relative' },
  image: {
    width: CARD_WIDTH,
    height: 118,
    backgroundColor: colors.overlay,
  },
  priceTag: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  priceTagText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '900',
  },
  name: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginHorizontal: spacing.md,
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  ctaText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
});
