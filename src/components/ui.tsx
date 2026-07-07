/**
 * Small shared UI primitives for Forkly screens.
 * Nothing SDK-related here — just consistent cards, buttons, and section headers.
 */

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export function ScreenSection({
  title,
  subtitle,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : colors.surface;
  const fg = variant === 'secondary' ? colors.text : colors.textInverse;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'secondary' && styles.buttonBordered,
      ]}>
      <Text style={[styles.buttonText, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ZoneLoading({ label }: { label?: string }) {
  return (
    <View style={styles.zoneLoading}>
      <ActivityIndicator color={colors.primary} />
      {label ? <Text style={styles.zoneLoadingText}>{label}</Text> : null}
    </View>
  );
}

export function ZoneFallback({ error, name }: { error: Error; name: string }) {
  // Keep this quiet and non-alarming: an empty/failed zone is expected when the
  // backend has no active campaign for it. We surface a subtle note in the demo.
  return (
    <View style={styles.zoneFallback}>
      <Text style={styles.zoneFallbackTitle}>No content for “{name}”</Text>
      <Text style={styles.zoneFallbackText}>{error.message}</Text>
    </View>
  );
}

export function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionTitle: { ...typography.heading, marginBottom: spacing.xs },
  sectionSubtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  button: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBordered: { borderWidth: 1, borderColor: colors.border },
  buttonText: { fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.9 },
  zoneLoading: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  zoneLoadingText: { ...typography.caption },
  zoneFallback: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.overlay,
  },
  zoneFallbackTitle: { ...typography.body, fontWeight: '700' },
  zoneFallbackText: { ...typography.caption, marginTop: spacing.xs },
  pill: {
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pillText: { ...typography.caption, color: colors.text },
});
