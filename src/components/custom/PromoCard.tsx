/**
 * PromoCard — a custom ContentZone component for Forkly's "Promo_Card" zone.
 *
 * Replaces the OOTB `Banner` previously wired into the Promo_Card zone with an
 * app-specific, food-app-themed promo/coupon design: a redeemable "ticket" card
 * with a discount medallion, a perforated tear line, and a dashed promo-code
 * chip — the kind of offer surface a real food-delivery app would show.
 *
 * It implements the public `Component<ComponentModel>` protocol (same contract
 * as `DishSpotlight`): its `name` is the backend transformer match name
 * (`"promocode"`), it owns validation of the raw payload, and it fires the
 * automatic View/Click engagement events itself via the public engagement
 * helpers when the content is PRODUCTION.
 *
 * Payload shape (Banner-compatible so existing campaigns keep working):
 *   { header, subheader?, imageUrl?, ctaText?, ctaUrl?, promoCode?, discountLabel? }
 */

import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  type Component,
  type ComponentModel,
  type ComponentContext,
  getPayloadForAction,
  trackEngagement,
} from '@salesforce-personalization/react-native-personalization';
import { colors, radius, spacing } from '../../theme';
import { logCall } from '../../personalization/eventLog';

/** Model this custom component renders. Banner-compatible + promo extras. */
export interface PromoCardModel extends ComponentModel {
  header: string;
  subheader?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  /** Optional redeemable code, e.g. "FORK20". */
  promoCode?: string;
  /** Optional short offer medallion text, e.g. "20% OFF" or "FREE". */
  discountLabel?: string;
}

type PromoCardConfig = {
  /** Fired when the user taps the promo card. */
  onTap?: (model: PromoCardModel, ctaUrl?: string) => void;
};

/**
 * Backend transformer match name for this zone's content.
 * REQUIRED: must be "promocard".
 */
const WIRE_NAME = 'promocard';

/**
 * Factory returning a Component instance, mirroring how OOTB `Banner()` /
 * `Recommendations()` and the custom `DishSpotlight()` are constructed.
 */
export function PromoCard(
  config: PromoCardConfig = {},
): Component<PromoCardModel> {
  return {
    name: WIRE_NAME,

    validateAndCreateComponentModel(json: string): PromoCardModel {
      const raw = JSON.parse(json) as Partial<PromoCardModel>;
      // A custom component owns its validation. Enforce the fields we render.
      if (!raw.header) {
        throw new Error('PromoCard requires a "header"');
      }
      return {
        header: raw.header,
        subheader: raw.subheader,
        imageUrl: raw.imageUrl,
        ctaText: raw.ctaText,
        ctaUrl: raw.ctaUrl,
        promoCode: raw.promoCode,
        discountLabel: raw.discountLabel,
      };
    },

    compose(model: PromoCardModel, context: ComponentContext) {
      return <PromoCardView model={model} context={context} onTap={config.onTap} />;
    },
  };
}

/** Derive a compact medallion label from the model (falls back to a spark). */
function medallionText(model: PromoCardModel): string {
  if (model.discountLabel) {
    return model.discountLabel;
  }
  // Try to pull a "20%" / "$5" style token out of the header for the medallion.
  const match = model.header.match(/(\d+%|\$\d+)/);
  return match ? match[1] : 'DEAL';
}

function PromoCardView({
  model,
  context,
  onTap,
}: {
  model: PromoCardModel;
  context: ComponentContext;
  onTap?: (model: PromoCardModel, ctaUrl?: string) => void;
}) {
  // Fire a "View" engagement whenever a new personalization instance renders.
  // Keyed on personalizationId so a silent refresh re-tracks the view.
  // Only PRODUCTION content carries engagement payloads (MOCK/PREVIEW do not).
  React.useEffect(() => {
    if (
      context.contentSource === 'PRODUCTION' &&
      context.engagementPayloads?.type === 'PerAction'
    ) {
      const payload = getPayloadForAction(context.engagementPayloads, 'View');
      if (payload) {
        trackEngagement(payload);
        logCall('engagement', 'PromoCard View (custom)', {
          source: context.contentSource,
        });
      }
    }
  }, [context.personalizationId, context.contentSource, context.engagementPayloads]);

  const handlePress = () => {
    if (
      context.contentSource === 'PRODUCTION' &&
      context.engagementPayloads?.type === 'PerAction'
    ) {
      const payload = getPayloadForAction(context.engagementPayloads, 'Click');
      if (payload) {
        trackEngagement(payload);
        logCall('engagement', 'PromoCard Click (custom)', {
          source: context.contentSource,
        });
      }
    }
    onTap?.(model, model.ctaUrl);
  };

  const ctaLabel = model.ctaText ?? 'Redeem offer';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${model.header}. ${ctaLabel}`}>
      {/* Left rail: discount medallion + optional thumbnail. */}
      <View style={styles.rail}>
        {model.imageUrl ? (
          <Image source={{ uri: model.imageUrl }} style={styles.thumb} />
        ) : null}
        <View style={styles.medallion}>
          <Text style={styles.medallionText} numberOfLines={1}>
            {medallionText(model)}
          </Text>
        </View>
      </View>

      {/* Perforated tear line, like a real coupon. */}
      <View style={styles.perforation}>
        <View style={[styles.notch, styles.notchTop]} />
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={styles.perfDot} />
        ))}
        <View style={[styles.notch, styles.notchBottom]} />
      </View>

      {/* Right side: offer copy + promo-code chip + CTA. */}
      <View style={styles.body}>
        <Text style={styles.eyebrow}>🍴 FORKLY OFFER</Text>
        <Text style={styles.header} numberOfLines={2}>
          {model.header}
        </Text>
        {model.subheader ? (
          <Text style={styles.subheader} numberOfLines={2}>
            {model.subheader}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {model.promoCode ? (
            <View style={styles.codeChip}>
              <Text style={styles.codeLabel}>CODE</Text>
              <Text style={styles.codeValue}>{model.promoCode}</Text>
            </View>
          ) : null}
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 132,
  },
  cardPressed: { opacity: 0.92 },
  rail: {
    width: 108,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  thumb: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  medallion: {
    minWidth: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionText: {
    color: colors.textInverse,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  perforation: {
    width: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: spacing.sm,
  },
  perfDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  notch: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.background,
  },
  notchTop: { top: -7 },
  notchBottom: { bottom: -7 },
  body: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  header: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subheader: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  codeLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  codeValue: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cta: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  ctaText: { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
});
