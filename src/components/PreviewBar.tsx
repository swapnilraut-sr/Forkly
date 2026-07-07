/**
 * PreviewBar
 *
 * A small, self-contained "Preview a campaign" control that appears on every
 * screen that renders ContentZones. A marketer/reviewer pastes the preview URL
 * from a Personalization QR code (or deep link) and taps Apply; the URL is
 * forwarded to the SDK via `PersonalizationModule.handlePreviewUrl`, after which
 * the ContentZones on the screen automatically refetch in preview mode.
 *
 * This mirrors the real-world flow (scan QR → deep link → handlePreviewUrl) but
 * gives reviewers an explicit, always-visible entry point on the exact screen
 * whose zones they want to preview.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { handlePreviewUrl } from '../personalization/sdk';

const PREVIEW_TOKEN = 'sfp-preview';

export function PreviewBar({
  onApplied,
  placeholder = 'Paste preview URL (…?sfp-preview=…)',
}: {
  /** Called after a preview URL is successfully applied — refresh zones here. */
  onApplied?: () => void;
  placeholder?: string;
}) {
  const [url, setUrl] = React.useState('');
  const [status, setStatus] = React.useState<{
    kind: 'ok' | 'error';
    message: string;
  } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = React.useCallback(async () => {
    const value = url.trim();
    if (!value) {
      setStatus({ kind: 'error', message: 'Enter a preview URL first.' });
      return;
    }
    if (!value.includes(PREVIEW_TOKEN)) {
      setStatus({
        kind: 'error',
        message: `URL must contain an ${PREVIEW_TOKEN} token.`,
      });
      return;
    }
    setBusy(true);
    try {
      await handlePreviewUrl(value);
      setStatus({ kind: 'ok', message: 'Preview applied — refreshing zones…' });
      setUrl('');
      onApplied?.();
    } catch (e) {
      setStatus({ kind: 'error', message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }, [url, onApplied]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>🔎 Preview a campaign</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Pressable
          onPress={submit}
          disabled={busy}
          style={({ pressed }) => [
            styles.button,
            { opacity: busy ? 0.5 : pressed ? 0.85 : 1 },
          ]}>
          <Text style={styles.buttonText}>{busy ? '…' : 'Apply'}</Text>
        </Pressable>
      </View>
      {status ? (
        <Text
          style={[
            styles.status,
            { color: status.kind === 'ok' ? colors.success : colors.danger },
          ]}>
          {status.message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    gap: spacing.sm,
  },
  title: { ...typography.caption, fontWeight: '700', color: colors.accent },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: { color: colors.textInverse, fontWeight: '700', fontSize: 14 },
  status: { ...typography.caption },
});
