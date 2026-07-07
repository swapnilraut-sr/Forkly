/**
 * DishSpotlight — a custom ContentZone component.
 *
 * Demonstrates the public `Component<ComponentModel>` protocol: an app can define
 * its own renderer, register it in a ContentZone's `allowedComponents`, and the
 * SDK will hand it the raw component JSON to validate, model, and compose.
 *
 * We reuse the OOTB Banner transformer's wire name (`Salesforce_Banner`) so this custom
 * renderer receives Banner-shaped payloads *and* the automatic engagement
 * payloads in `context` — then we render our own richer layout and fire the
 * View/Click engagement events ourselves via the public engagement helpers.
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

/** Model this custom component renders. Shaped like a Banner payload. */
export interface DishSpotlightModel extends ComponentModel {
  header: string;
  subheader?: string;
  imageUrl: string;
  ctaText?: string;
  ctaUrl?: string;
}

type DishSpotlightConfig = {
  /** Fired when the user taps the spotlight card. */
  onTap?: (model: DishSpotlightModel, ctaUrl?: string) => void;
};

const WIRE_NAME = 'Salesforce_Banner';

/**
 * Factory returning a Component instance, mirroring how OOTB `Banner()` /
 * `Recommendations()` are constructed.
 */
export function DishSpotlight(
  config: DishSpotlightConfig = {},
): Component<DishSpotlightModel> {
  return {
    name: WIRE_NAME,

    validateAndCreateComponentModel(json: string): DishSpotlightModel {
      const raw = JSON.parse(json) as Partial<DishSpotlightModel>;
      // A custom component owns its validation. Enforce the fields we render.
      if (!raw.header || !raw.imageUrl) {
        throw new Error('DishSpotlight requires "header" and "imageUrl"');
      }
      return {
        header: raw.header,
        subheader: raw.subheader,
        imageUrl: raw.imageUrl,
        ctaText: raw.ctaText,
        ctaUrl: raw.ctaUrl,
      };
    },

    compose(model: DishSpotlightModel, context: ComponentContext) {
      return (
        <DishSpotlightView model={model} context={context} onTap={config.onTap} />
      );
    },
  };
}

function DishSpotlightView({
  model,
  context,
  onTap,
}: {
  model: DishSpotlightModel;
  context: ComponentContext;
  onTap?: (model: DishSpotlightModel, ctaUrl?: string) => void;
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
        logCall('engagement', 'DishSpotlight View (custom)', {
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
        logCall('engagement', 'DishSpotlight Click (custom)', {
          source: context.contentSource,
        });
      }
    }
    onTap?.(model, model.ctaUrl);
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <Image source={{ uri: model.imageUrl }} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.badge}>CHEF'S SPOTLIGHT</Text>
        <Text style={styles.header}>{model.header}</Text>
        {model.subheader ? (
          <Text style={styles.subheader}>{model.subheader}</Text>
        ) : null}
        {model.ctaText ? (
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{model.ctaText}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    minHeight: 180,
    justifyContent: 'flex-end',
  },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    padding: spacing.lg,
  },
  badge: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    opacity: 0.9,
  },
  header: { color: colors.textInverse, fontSize: 22, fontWeight: '800' },
  subheader: {
    color: colors.textInverse,
    fontSize: 14,
    marginTop: spacing.xs,
    opacity: 0.95,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  ctaText: { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
});
