/**
 * Activity screen (pushed from Account).
 *
 * A live feed of every Personalization API call the app has made, sourced from
 * the in-app event log. This is a demo aid to make the SDK's behavior visible —
 * each row shows the category, the API/label, and any payload.
 */

import * as React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme';
import { PrimaryButton } from '../components/ui';
import {
  clearEntries,
  subscribe,
  type LogCategory,
  type LogEntry,
} from '../personalization/eventLog';

const CATEGORY_COLOR: Record<LogCategory, string> = {
  event: '#4C6EF5',
  identity: '#12B886',
  consent: '#F59F00',
  engagement: '#BE4BDB',
  preview: '#E8590C',
  contentzone: '#1098AD',
  logging: '#868E96',
};

function formatTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = React.useState<LogEntry[]>([]);

  React.useEffect(() => subscribe(setEntries), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Text style={typography.title}>SDK Activity</Text>
        <View style={styles.clearButton}>
          <PrimaryButton variant="secondary" label="Clear" onPress={clearEntries} />
        </View>
      </View>
      <Text style={[typography.caption, styles.subtitle]}>
        {entries.length} call{entries.length === 1 ? '' : 's'} recorded
      </Text>

      <FlatList
        data={entries}
        keyExtractor={e => e.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={[typography.caption, styles.empty]}>
            No calls yet. Interact with the app to see SDK activity.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: CATEGORY_COLOR[item.category] }]} />
            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.time}>{formatTime(item.at)}</Text>
              </View>
              <Text style={styles.category}>{item.category}</Text>
              {item.detail && Object.keys(item.detail).length > 0 ? (
                <Text style={styles.detail}>{JSON.stringify(item.detail)}</Text>
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  clearButton: { minWidth: 90 },
  subtitle: { paddingHorizontal: spacing.lg, marginTop: spacing.xs },
  separator: { height: spacing.sm },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.body, fontWeight: '700', flex: 1 },
  time: { ...typography.caption, fontSize: 11 },
  category: { ...typography.caption, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  detail: {
    ...typography.caption,
    fontFamily: 'Courier',
    fontSize: 11,
    color: colors.text,
    marginTop: 2,
  },
  empty: { textAlign: 'center', marginTop: spacing.xxl },
});
