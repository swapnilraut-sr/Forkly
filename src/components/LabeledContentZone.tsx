/**
 * LabeledContentZone / LabeledMockContentZone
 *
 * Thin wrappers around the plugin's `ContentZone` and `MockContentZone` that add
 * a small demo-only header (zone name + a "LIVE" / "MOCK" tag) and wire in
 * consistent loading / fallback UI. They also log the zone's lifecycle to the
 * Activity screen. The personalization behavior is 100% the plugin's — we only
 * decorate the surrounding chrome.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  ContentZone,
  MockContentZone,
  type Component,
  type ComponentModel,
  type ContentZoneController,
  type DecisionsRequestContext,
} from '@salesforce-personalization/react-native-personalization';
import { colors, radius, spacing, typography } from '../theme';
import { logCall } from '../personalization/eventLog';
import { isPreview } from '../personalization/sdk';
import { ZoneFallback, ZoneLoading } from './ui';

function ZoneHeader({
  name,
  tag,
  preview,
}: {
  name: string;
  tag: 'LIVE' | 'MOCK';
  preview?: boolean;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.zoneName}>{name}</Text>
      <View style={styles.tagRow}>
        {preview ? (
          <View style={[styles.tag, styles.tagPreview]}>
            <Text style={styles.tagText}>PREVIEW</Text>
          </View>
        ) : null}
        <View style={[styles.tag, tag === 'MOCK' && styles.tagMock]}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * `previewNonce` — bump this (e.g. after applying a preview URL) to make the
 * zone re-check `isPreview(name)` so the PREVIEW badge reflects current state.
 */
export function LabeledContentZone({
  name,
  allowedComponents,
  decisionsRequestContext,
  controller,
  loadingLabel,
  timeoutSeconds,
  previewNonce,
  fallbackContent,
}: {
  name: string;
  allowedComponents: Component<ComponentModel>[];
  decisionsRequestContext?: DecisionsRequestContext;
  controller?: ContentZoneController;
  loadingLabel?: string;
  timeoutSeconds?: number;
  previewNonce?: number;
  /**
   * Optional content to render when the live zone returns nothing / errors
   * (e.g. no active Data Cloud campaign yet). When provided, this is shown as a
   * graceful sample instead of the "No content" error card, so the screen still
   * looks complete during a demo.
   */
  fallbackContent?: React.ReactNode;
}) {
  const [preview, setPreview] = React.useState(false);

  React.useEffect(() => {
    logCall('contentzone', `mount ${name}`, {
      allowed: allowedComponents.map(c => c.name),
    });
  }, [name, allowedComponents]);

  // Reflect whether this specific zone is currently in preview mode.
  React.useEffect(() => {
    let cancelled = false;
    isPreview(name)
      .then(p => {
        if (!cancelled) {
          setPreview(p);
        }
      })
      .catch(() => {
        /* isPreview is best-effort for the badge; ignore failures */
      });
    return () => {
      cancelled = true;
    };
  }, [name, previewNonce]);

  return (
    <View style={styles.wrapper}>
      <ZoneHeader name={name} tag="LIVE" preview={preview} />
      <ContentZone
        name={name}
        allowedComponents={allowedComponents}
        decisionsRequestContext={decisionsRequestContext}
        controller={controller}
        timeoutSeconds={timeoutSeconds}
        loading={<ZoneLoading label={loadingLabel ?? `Fetching ${name}…`} />}
        fallback={error => {
          logCall('contentzone', `fallback ${name}`, { message: error.message });
          // If the caller supplied sample content, render it as a graceful
          // alternate (a valid-looking view) instead of the error card.
          if (fallbackContent !== undefined) {
            return <View style={styles.fallbackBody}>{fallbackContent}</View>;
          }
          return <ZoneFallback error={error} name={name} />;
        }}
      />
    </View>
  );
}

export function LabeledMockContentZone({
  name,
  allowedComponents,
  mockContent,
  mockLoadingSeconds,
  controller,
}: {
  name: string;
  allowedComponents: Component<ComponentModel>[];
  mockContent: () => ComponentModel;
  mockLoadingSeconds?: number;
  controller?: ContentZoneController;
}) {
  return (
    <View style={styles.wrapper}>
      <ZoneHeader name={name} tag="MOCK" />
      <MockContentZone
        name={name}
        allowedComponents={allowedComponents}
        mockContent={mockContent}
        mockLoadingSeconds={mockLoadingSeconds}
        controller={controller}
        loading={<ZoneLoading label={`Loading mock ${name}…`} />}
        fallback={error => <ZoneFallback error={error} name={name} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  fallbackBody: { paddingHorizontal: spacing.xs, paddingTop: spacing.xs },
  zoneName: { ...typography.caption, fontWeight: '700', color: colors.textMuted },
  tagRow: { flexDirection: 'row', gap: spacing.xs },
  tag: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagMock: { backgroundColor: colors.textMuted },
  tagPreview: { backgroundColor: '#A020F0' },
  tagText: { color: colors.textInverse, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
