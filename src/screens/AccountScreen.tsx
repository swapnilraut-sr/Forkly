/**
 * Account screen (fourth tab).
 *
 * A polished, product-shaped identity page that still exercises the full
 * Personalization identity/consent/preview/logging surface. Every action shows
 * a friendly label with the exact `PersonalizationModule` API it calls as a
 * caption, so a reviewer can map UX → API at a glance and watch the Activity
 * log update.
 *
 *   Identity : setProfileId / getProfileId, setAttribute(s) / getAttributes,
 *              clearAttribute / clearAllAttributes, party identification get/set
 *   Consent  : setConsent(true/false), isConsentOptIn
 *   Preview  : handlePreviewUrl (via PreviewBar), isPreview
 *   Logging  : setLogging(level)
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProfileAttributes } from '@salesforce-personalization/react-native-personalization';
import type { AccountStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { PrimaryButton } from '../components/ui';
import { PreviewBar } from '../components/PreviewBar';
import { useSession } from '../context/PersonalizationContext';
import * as SDK from '../personalization/sdk';

type Nav = NativeStackNavigationProp<AccountStackParamList>;

const HOME_HERO_ZONE = 'home_hero_banner';

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {subtitle ? <Text style={styles.panelSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
    </View>
  );
}

/** A friendly action button with the underlying API shown as a caption. */
function ApiAction({
  label,
  api,
  onPress,
  variant = 'primary',
}: {
  label: string;
  api: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  return (
    <View style={styles.actionGrow}>
      <PrimaryButton label={label} variant={variant} onPress={onPress} />
      <Text style={styles.apiCaption}>{api}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const session = useSession();

  const [profileId, setProfileId] = React.useState('forkly-user-001');
  const [attrKey, setAttrKey] = React.useState('favoriteCuisine');
  const [attrValue, setAttrValue] = React.useState('Italian');
  const [partyName, setPartyName] = React.useState('Alex Diner');
  const [partyNumber, setPartyNumber] = React.useState('55501');
  const [partyType, setPartyType] = React.useState('individual');
  const [status, setStatus] = React.useState<{
    kind: 'ok' | 'error';
    message: string;
  } | null>(null);

  // Snapshot of current identity/consent state for the profile card.
  const [attributes, setAttributes] = React.useState<ProfileAttributes>({});
  const [party, setParty] = React.useState<{
    name: string | null;
    number: string | null;
    type: string | null;
  }>({ name: null, number: null, type: null });

  const run = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
      setStatus({ kind: 'ok', message: `✓ ${label}` });
    } catch (e) {
      setStatus({ kind: 'error', message: `✗ ${label}: ${(e as Error).message}` });
    }
  };

  const refreshProfileCard = React.useCallback(async () => {
    await session.refreshProfileId();
    await session.refreshConsent();
    const [attrs, p] = await Promise.all([
      SDK.getAttributes(),
      SDK.getPartyIdentification(),
    ]);
    setAttributes(attrs);
    setParty(p);
  }, [session]);

  // Load the current identity snapshot on first open.
  React.useEffect(() => {
    refreshProfileCard().catch(() => {
      /* best-effort; controls below still work */
    });
  }, [refreshProfileCard]);

  const consentText =
    session.consentOptIn === null
      ? 'Not set'
      : session.consentOptIn
        ? 'On (opted in)'
        : 'Off (opted out)';

  const attributeEntries = Object.entries(attributes);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={typography.title}>Account</Text>
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

      {/* Identity snapshot card */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(party.name ?? 'Guest').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{party.name ?? 'Guest diner'}</Text>
          <Text style={styles.cardMeta}>
            Profile: {session.profileId ?? '(none)'}
          </Text>
          <Text style={styles.cardMeta}>Personalization: {consentText}</Text>
        </View>
      </View>
      <View style={styles.refreshRow}>
        <PrimaryButton
          variant="secondary"
          label="Refresh identity"
          onPress={() => run('refresh identity', refreshProfileCard)}
        />
        <Text style={styles.apiCaption}>
          getProfileId · getAttributes · getPartyIdentification*
        </Text>
      </View>

      <Panel
        title="Sign in"
        subtitle="Identify the current diner to the personalization engine.">
        <Field label="Profile ID" value={profileId} onChangeText={setProfileId} />
        <View style={styles.buttonRow}>
          <ApiAction
            label="Sign in"
            api="setProfileId()"
            onPress={() =>
              run('sign in', async () => {
                await SDK.setProfileId(profileId);
                await refreshProfileCard();
              })
            }
          />
          <ApiAction
            label="Sign out"
            api="setProfileId('') "
            variant="danger"
            onPress={() =>
              run('sign out', async () => {
                await SDK.setProfileId('');
                await refreshProfileCard();
              })
            }
          />
        </View>
      </Panel>

      <Panel
        title="Contact details"
        subtitle="Party identification associated with this device.">
        <Field label="Name" value={partyName} onChangeText={setPartyName} />
        <Field label="Number" value={partyNumber} onChangeText={setPartyNumber} />
        <Field label="Type" value={partyType} onChangeText={setPartyType} />
        <View style={styles.buttonRow}>
          <ApiAction
            label="Save contact"
            api="setPartyIdentificationName/Number/Type()"
            onPress={() =>
              run('save contact', async () => {
                await SDK.setPartyIdentification({
                  name: partyName,
                  number: partyNumber,
                  type: partyType,
                });
                await refreshProfileCard();
              })
            }
          />
        </View>
      </Panel>

      <Panel
        title="Preferences"
        subtitle="Profile attributes that personalize recommendations.">
        <Field label="Preference key" value={attrKey} onChangeText={setAttrKey} />
        <Field label="Value" value={attrValue} onChangeText={setAttrValue} />
        <View style={styles.buttonRow}>
          <ApiAction
            label="Save preference"
            api="setAttribute()"
            onPress={() =>
              run('save preference', async () => {
                await SDK.setAttribute(attrKey, attrValue);
                await refreshProfileCard();
              })
            }
          />
          <ApiAction
            label="Remove"
            api="clearAttribute()"
            variant="secondary"
            onPress={() =>
              run('remove preference', async () => {
                await SDK.clearAttribute(attrKey);
                await refreshProfileCard();
              })
            }
          />
        </View>
        <View style={styles.buttonRow}>
          <ApiAction
            label="Sample profile"
            api="setAttributes() batch"
            variant="secondary"
            onPress={() =>
              run('apply sample profile', async () => {
                await SDK.setAttributes({
                  favoriteCuisine: attrValue,
                  tier: 'gold',
                  city: 'San Francisco',
                } as ProfileAttributes);
                await refreshProfileCard();
              })
            }
          />
          <ApiAction
            label="Reset all"
            api="clearAllAttributes()"
            variant="danger"
            onPress={() =>
              run('reset preferences', async () => {
                await SDK.clearAllAttributes();
                await refreshProfileCard();
              })
            }
          />
        </View>

        <Text style={styles.subhead}>Current preferences</Text>
        {attributeEntries.length === 0 ? (
          <Text style={styles.emptyHint}>No preferences saved yet.</Text>
        ) : (
          attributeEntries.map(([k, v]) => <Row key={k} label={k} value={String(v)} />)
        )}
      </Panel>

      <Panel
        title="Privacy & consent"
        subtitle="Controls whether the SDK may collect and send data.">
        <Row label="Current" value={consentText} />
        <View style={styles.buttonRow}>
          <ApiAction
            label="Opt in"
            api="setConsent(true)"
            onPress={() =>
              run('opt in', async () => {
                await SDK.setConsent(true);
                await session.refreshConsent();
              })
            }
          />
          <ApiAction
            label="Opt out"
            api="setConsent(false)"
            variant="danger"
            onPress={() =>
              run('opt out', async () => {
                await SDK.setConsent(false);
                await session.refreshConsent();
              })
            }
          />
        </View>
        <View style={styles.buttonRow}>
          <ApiAction
            label="Check consent"
            api="isConsentOptIn()"
            variant="secondary"
            onPress={() => run('check consent', () => session.refreshConsent())}
          />
        </View>
      </Panel>

      <Panel
        title="Preview a campaign"
        subtitle="Paste a preview URL (or scan a QR deep link) to activate preview mode.">
        <PreviewBar placeholder="personalizationdemo://preview?sfp-preview=…" />
        <View style={styles.buttonRow}>
          <ApiAction
            label="Check preview"
            api={`isPreview('${HOME_HERO_ZONE}')`}
            variant="secondary"
            onPress={() =>
              run('isPreview', async () => {
                const p = await SDK.isPreview(HOME_HERO_ZONE);
                setStatus({
                  kind: 'ok',
                  message: `isPreview(${HOME_HERO_ZONE}) = ${p}`,
                });
              })
            }
          />
        </View>
      </Panel>

      {/* Developer tools — clearly separated from the product-facing controls. */}
      <Panel
        title="Developer tools"
        subtitle="SDK diagnostics — not part of the customer experience.">
        <Text style={styles.subhead}>Log level (setLogging)</Text>
        <View style={styles.buttonRow}>
          <View style={styles.actionGrow}>
            <PrimaryButton label="DEBUG" onPress={() => run('setLogging(DEBUG)', () => SDK.setLogging('DEBUG'))} />
          </View>
          <View style={styles.actionGrow}>
            <PrimaryButton variant="secondary" label="WARN" onPress={() => run('setLogging(WARN)', () => SDK.setLogging('WARN'))} />
          </View>
        </View>
        <View style={styles.buttonRow}>
          <View style={styles.actionGrow}>
            <PrimaryButton variant="secondary" label="ERROR" onPress={() => run('setLogging(ERROR)', () => SDK.setLogging('ERROR'))} />
          </View>
          <View style={styles.actionGrow}>
            <PrimaryButton variant="secondary" label="NONE" onPress={() => run('setLogging(NONE)', () => SDK.setLogging('NONE'))} />
          </View>
        </View>
        <Pressable style={styles.activityLink} onPress={() => navigation.navigate('Activity')}>
          <Text style={styles.activityLinkText}>View SDK activity log →</Text>
        </Pressable>
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  status: { ...typography.caption, marginTop: spacing.xs, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.textInverse, fontSize: 24, fontWeight: '800' },
  cardBody: { flex: 1, gap: 2 },
  cardName: { ...typography.heading },
  cardMeta: { ...typography.caption },
  refreshRow: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  panel: {
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  panelTitle: { ...typography.heading },
  panelSubtitle: { ...typography.caption, marginBottom: spacing.xs },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.caption },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  actionGrow: { flex: 1, gap: spacing.xs },
  apiCaption: {
    ...typography.caption,
    fontFamily: 'Courier',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  subhead: {
    ...typography.caption,
    fontWeight: '700',
    marginTop: spacing.sm,
    color: colors.text,
  },
  emptyHint: { ...typography.caption },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: { ...typography.caption, fontWeight: '700' },
  infoValue: { ...typography.caption, flexShrink: 1, textAlign: 'right' },
  activityLink: { marginTop: spacing.sm, paddingVertical: spacing.sm },
  activityLinkText: { ...typography.body, color: colors.primary, fontWeight: '700' },
});
