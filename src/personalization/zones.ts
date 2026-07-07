/**
 * ContentZone building blocks.
 *
 * Central place that constructs the OOTB `Banner()` / `Recommendations()`
 * component instances (with Forkly styling + tap handlers) and our custom
 * `DishSpotlight()` renderer. Screens call these factories to get the
 * `allowedComponents` array for a given zone.
 *
 * Tap handlers here also demonstrate engagement-adjacent event tracking: when a
 * user taps a Banner/Recommendation we additionally log an EngagementEvent via
 * the public track() API (the OOTB components already fire their own automatic
 * View/Click engagement payloads internally).
 */

import * as React from 'react';
import {
  Banner,
  Recommendations,
  type BannerStyle,
  type BannerTapEvent,
  type Component,
  type ComponentContext,
  type ComponentModel,
  type RecommendationsStyle,
  type RecommendationTapEvent,
} from '@salesforce-personalization/react-native-personalization';
import { colors, radius } from '../theme';
import { menuItems, type MenuItem } from '../data/catalog';
import { DishSpotlight, type DishSpotlightModel } from '../components/custom/DishSpotlight';
import {
  FeaturedCarousel,
  type FeaturedItem,
} from '../components/custom/FeaturedCarousel';
import { PromoCard, type PromoCardModel } from '../components/custom/PromoCard';
import {
  ProductRecs,
  type ProductRecItem,
} from '../components/custom/ProductRecs';
import { trackEngagementEvent } from './sdk';

const bannerStyle: BannerStyle = {
  backgroundColor: colors.surface,
  headerTextColor: colors.text,
  subheaderTextColor: colors.textMuted,
  ctaTextColor: colors.primary,
  imageWidthFraction: 0.4,
  contentPadding: 16,
  maxImageSize: 140,
};

const recommendationsStyle: RecommendationsStyle = {
  cardSpacing: 12,
  containerStyle: { paddingVertical: 4 },
  sectionHeader: {
    textColor: colors.text,
    padding: 8,
    textStyle: { fontWeight: '700', fontSize: 16 },
  },
  card: {
    backgroundColor: colors.surface,
    nameTextColor: colors.text,
    descriptionTextColor: colors.textMuted,
    ctaTextColor: colors.primary,
    contentPadding: 12,
    imageWidthFraction: 0.35,
    maxImageSize: 120,
  },
};

/** OOTB Banner with Forkly styling. `onTap` receives the tapped BannerModel. */
export function forklyBanner(
  onTap?: (event: BannerTapEvent) => void,
): Component<ComponentModel> {
  return Banner({
    style: bannerStyle,
    onTap: event => {
      trackEngagementEvent('forkly_banner_tap', {
        header: event.header,
        ctaUrl: event.ctaUrl ?? '',
      });
      onTap?.(event);
    },
  }) as Component<ComponentModel>;
}

/** OOTB Recommendations with Forkly styling. `onTap` receives item + index. */
export function forklyRecommendations(
  onTap?: (event: RecommendationTapEvent) => void,
): Component<ComponentModel> {
  return Recommendations({
    style: recommendationsStyle,
    onTap: event => {
      trackEngagementEvent('forkly_recommendation_tap', {
        itemId: event.item.id,
        itemName: event.item.name,
        index: event.index,
      });
      onTap?.(event);
    },
  }) as Component<ComponentModel>;
}

/**
 * Custom ProductRecs component instance for the "Product_Recommendations" zone.
 *
 * Replaces the OOTB (vertical) Recommendations component with a custom,
 * food-app-themed horizontal product rail. Its wire `name` is
 * `"productrecommendations"`. It receives Recommendations-shaped list payloads
 * and fires PerItemAndAction engagement. `onTap` receives the tapped item and
 * its index.
 */
export function forklyProductRecs(
  onTap?: (item: ProductRecItem, index: number) => void,
): Component<ComponentModel> {
  return ProductRecs({
    onTap: (item, index) => {
      trackEngagementEvent('forkly_product_rec_tap', {
        itemId: item.id,
        itemName: item.name,
        index,
      });
      onTap?.(item, index);
    },
  }) as Component<ComponentModel>;
}

/**
 * Custom list-style component instance. Demonstrates the PerItemAndAction
 * engagement path via `getPayloadForItemAndAction` inside FeaturedCarousel.
 */
export function forklyFeatured(
  onTap?: (item: FeaturedItem, index: number) => void,
): Component<ComponentModel> {
  return FeaturedCarousel({
    onTap: (item, index) => {
      trackEngagementEvent('forkly_featured_tap', {
        itemId: item.id,
        itemName: item.name,
        index,
      });
      onTap?.(item, index);
    },
  }) as Component<ComponentModel>;
}

/**
 * Custom PromoCard component instance for the "Promo_Card" zone.
 *
 * Replaces the OOTB Banner previously used there with an app-specific,
 * food-app-themed coupon card. Its wire `name` is `"promocard"`. `onTap`
 * receives the tapped PromoCardModel and its ctaUrl.
 */
export function forklyPromo(
  onTap?: (model: PromoCardModel, ctaUrl?: string) => void,
): Component<ComponentModel> {
  return PromoCard({
    onTap: (model, ctaUrl) => {
      trackEngagementEvent('forkly_promo_tap', {
        header: model.header,
        promoCode: model.promoCode ?? '',
        ctaUrl: ctaUrl ?? '',
      });
      onTap?.(model, ctaUrl);
    },
  }) as Component<ComponentModel>;
}

/** Custom DishSpotlight component instance. */
export function forklySpotlight(
  onTap?: (model: DishSpotlightModel, ctaUrl?: string) => void,
): Component<ComponentModel> {
  return DishSpotlight({
    onTap: (model, ctaUrl) => {
      trackEngagementEvent('forkly_spotlight_tap', { header: model.header });
      onTap?.(model, ctaUrl);
    },
  }) as Component<ComponentModel>;
}

// ---------------------------------------------------------------------------
// Mock content providers (for MockContentZone — no backend needed)
// ---------------------------------------------------------------------------

export const mockBannerContent = (): ComponentModel =>
  ({
    componentName: 'Salesforce_Banner',
    header: 'Free delivery this weekend',
    subheader: 'On orders over $20 from local favorites.',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=60',
    ctaText: 'Order now',
    ctaUrl: 'forkly://promo/free-delivery',
  }) as ComponentModel;

export const mockRecommendationsContent = (): ComponentModel =>
  ({
    componentName: 'Salesforce_Recommendations',
    sectionHeader: 'Popular near you',
    ctaText: 'View',
    items: [
      {
        id: 'item-margherita-classica',
        name: 'Margherita Classica',
        description: "Napoli's Finest · 28 min",
        imageUrl:
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=60',
        url: 'forkly://dish/item-margherita-classica',
      },
      {
        id: 'item-dragon-roll',
        name: 'Dragon Roll',
        description: 'Sakura Omakase · 38 min',
        imageUrl:
          'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?auto=format&fit=crop&w=400&q=60',
        url: 'forkly://dish/item-dragon-roll',
      },
    ],
  }) as ComponentModel;

// ---------------------------------------------------------------------------
// Fallback content builders (for LabeledContentZone `fallbackContent`)
//
// Rendered when a LIVE zone returns nothing / errors (e.g. no active Data Cloud
// campaign yet). We compose the SAME custom components the zone would use, but
// with a MOCK context so NO engagement is tracked — it's a graceful sample
// built from real catalog products, not a real personalization result.
// ---------------------------------------------------------------------------

/** MOCK context: custom components skip engagement when contentSource !== PRODUCTION. */
const FALLBACK_CONTEXT: ComponentContext = {
  contentSource: 'MOCK',
  personalizationId: 'fallback',
  engagementPayloads: undefined,
};

/** Pick a stable, varied set of catalog items for sample content. */
function sampleItems(count: number, offset = 0): MenuItem[] {
  if (menuItems.length === 0) {
    return [];
  }
  const picked: MenuItem[] = [];
  for (let i = 0; i < count; i += 1) {
    picked.push(menuItems[(offset + i) % menuItems.length]);
  }
  return picked;
}

/**
 * Sample DishSpotlight for the "home_chef_spotlight" zone — a single featured
 * dish rendered with the real custom component. `onTap` navigates to its PDP.
 */
export function forklySpotlightFallback(
  onTap?: (item: MenuItem) => void,
): React.ReactElement | null {
  const item = sampleItems(1)[0];
  if (!item) {
    return null;
  }
  const component = DishSpotlight({
    onTap: () => onTap?.(item),
  });
  const model = component.validateAndCreateComponentModel(
    JSON.stringify({
      header: item.name,
      subheader: `${item.cuisine} · $${item.price.toFixed(2)}`,
      imageUrl: item.imageUrl,
      ctaText: 'View dish',
      ctaUrl: `forkly://dish/${item.id}`,
    }),
    FALLBACK_CONTEXT,
  );
  return component.compose(model, FALLBACK_CONTEXT);
}

/**
 * Sample FeaturedCarousel for the "home_featured" zone — a horizontal rail of
 * real catalog dishes rendered with the real custom component.
 */
export function forklyFeaturedFallback(
  onTap?: (item: MenuItem) => void,
): React.ReactElement | null {
  const items = sampleItems(6, 2);
  if (items.length === 0) {
    return null;
  }
  const byId = new Map(items.map(i => [i.id, i]));
  const component = FeaturedCarousel({
    onTap: featuredItem => {
      const match = byId.get(featuredItem.id);
      if (match) {
        onTap?.(match);
      }
    },
  });
  const model = component.validateAndCreateComponentModel(
    JSON.stringify({
      sectionHeader: 'Popular picks',
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        description: `${i.cuisine} · $${i.price.toFixed(2)}`,
        imageUrl: i.imageUrl,
        url: `forkly://dish/${i.id}`,
      })),
    }),
    FALLBACK_CONTEXT,
  );
  return component.compose(model, FALLBACK_CONTEXT);
}

/**
 * Sample ProductRecs for a recommendations zone (e.g. "cart_addons") — a
 * horizontal product rail of real catalog dishes.
 */
export function forklyProductRecsFallback(
  onTap?: (item: MenuItem) => void,
  sectionHeader = 'You might also like',
): React.ReactElement | null {
  const items = sampleItems(6, 8);
  if (items.length === 0) {
    return null;
  }
  const byId = new Map(items.map(i => [i.id, i]));
  const component = ProductRecs({
    onTap: recItem => {
      const match = byId.get(recItem.id);
      if (match) {
        onTap?.(match);
      }
    },
  });
  const model = component.validateAndCreateComponentModel(
    JSON.stringify({
      sectionHeader,
      ctaText: 'Add',
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        description: i.cuisine,
        imageUrl: i.imageUrl,
        url: `forkly://dish/${i.id}`,
        price: i.price,
      })),
    }),
    FALLBACK_CONTEXT,
  );
  return component.compose(model, FALLBACK_CONTEXT);
}

// re-export so screens can reference tokens if needed
export { radius };
