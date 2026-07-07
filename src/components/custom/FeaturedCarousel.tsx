/**
 * FeaturedCarousel — a custom, list-style ContentZone component.
 *
 * Complements `DishSpotlight` (a single-element / PerAction custom component) by
 * demonstrating the *list* engagement path: it receives Recommendations-shaped
 * payloads (`PerItemAndAction`) and fires per-item View/Click engagement using
 * the public `getPayloadForItemAndAction` helper.
 *
 * We reuse the OOTB Recommendations wire name (`Salesforce_Recommendations`) so this
 * custom renderer receives the same list payloads the OOTB component would,
 * then render our own horizontally-scrolling "Featured" layout.
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

export interface FeaturedItem {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  url?: string;
}

export interface FeaturedCarouselModel extends ComponentModel {
  sectionHeader?: string;
  items: FeaturedItem[];
}

type FeaturedCarouselConfig = {
  onTap?: (item: FeaturedItem, index: number) => void;
};

const WIRE_NAME = 'Salesforce_Recommendations';

export function FeaturedCarousel(
  config: FeaturedCarouselConfig = {},
): Component<FeaturedCarouselModel> {
  return {
    name: WIRE_NAME,

    validateAndCreateComponentModel(json: string): FeaturedCarouselModel {
      const raw = JSON.parse(json) as Partial<FeaturedCarouselModel>;
      if (!Array.isArray(raw.items) || raw.items.length === 0) {
        throw new Error('FeaturedCarousel requires a non-empty "items" array');
      }
      return {
        sectionHeader: raw.sectionHeader,
        items: raw.items as FeaturedItem[],
      };
    },

    compose(model: FeaturedCarouselModel, context: ComponentContext) {
      return (
        <FeaturedCarouselView
          model={model}
          context={context}
          onTap={config.onTap}
        />
      );
    },
  };
}

function FeaturedCarouselView({
  model,
  context,
  onTap,
}: {
  model: FeaturedCarouselModel;
  context: ComponentContext;
  onTap?: (item: FeaturedItem, index: number) => void;
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
      logCall('engagement', 'FeaturedCarousel View x' + model.items.length, {
        source,
      });
    }
  }, [context.personalizationId, source, context.engagementPayloads, model.items]);

  const handlePress = (item: FeaturedItem, index: number) => {
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
        logCall('engagement', 'FeaturedCarousel Click', { index, source });
      }
    }
    onTap?.(item, index);
  };

  return (
    <View>
      {model.sectionHeader ? (
        <Text style={styles.header}>{model.sectionHeader}</Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {model.items.map((item, index) => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() => handlePress(item, index)}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {item.description ? (
              <Text style={styles.description} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  row: { gap: spacing.md, paddingHorizontal: spacing.xs },
  card: { width: 160 },
  image: {
    width: 160,
    height: 110,
    borderRadius: radius.md,
    backgroundColor: colors.overlay,
  },
  name: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  description: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
