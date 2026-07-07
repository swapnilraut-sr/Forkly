/**
 * Cart screen (third tab).
 *
 * Line items with remove, a "recommended add-ons" ContentZone
 * ("cart_addons", Recommendations), and checkout. Cart mutations fire
 * CartEvent(add/remove/replace); checkout fires OrderEvent(purchase) via the
 * cart context. A successful checkout also shows the returned order id.
 */

import * as React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Order } from '@salesforce-personalization/react-native-personalization';
import { useContentZoneController } from '@salesforce-personalization/react-native-personalization';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme';
import { PrimaryButton, ScreenSection, Card } from '../components/ui';
import { LabeledContentZone } from '../components/LabeledContentZone';
import { PreviewBar } from '../components/PreviewBar';
import {
  forklyRecommendations,
  forklyProductRecsFallback,
} from '../personalization/zones';
import { trackOrder } from '../personalization/sdk';
import { useCart } from '../context/CartContext';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const [lastOrder, setLastOrder] = React.useState<Order | null>(null);
  const addonsController = useContentZoneController();
  const [previewNonce, setPreviewNonce] = React.useState(0);

  const addonsZone = React.useMemo(() => [forklyRecommendations()], []);

  // Sample add-ons shown when "cart_addons" has no live campaign yet. Tapping a
  // suggestion adds it straight to the cart (fires CartEvent(add)).
  const addonsFallback = React.useMemo(
    () => forklyProductRecsFallback(item => cart.add(item), 'Add to your order'),
    [cart],
  );

  const onPreviewApplied = React.useCallback(async () => {
    await addonsController.refresh(true);
    setPreviewNonce(n => n + 1);
  }, [addonsController]);

  const onCheckout = () => {
    if (cart.count === 0) {
      return;
    }
    const order = cart.checkout();
    setLastOrder(order);
  };

  // Reserve upcoming items instead of buying now — fires OrderEvent(preorder).
  const onPreorder = () => {
    if (cart.count === 0) {
      return;
    }
    const order = cart.checkout('preorder');
    setLastOrder(order);
  };

  // Demonstrate the remaining OrderEvent lifecycle subtypes on a placed order.
  const onOrderLifecycle = (
    subtype: 'ship' | 'deliver' | 'cancel' | 'return' | 'exchange',
  ) => {
    if (lastOrder) {
      trackOrder(subtype, lastOrder);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={typography.title}>Your cart</Text>
        <Text style={typography.caption}>
          {cart.count} item{cart.count === 1 ? '' : 's'}
        </Text>
      </View>

      {lastOrder ? (
        <View style={styles.confirmation}>
          <Text style={styles.confirmationTitle}>Order placed 🎉</Text>
          <Text style={typography.caption}>
            Order {lastOrder.id} · OrderEvent(purchase) sent
          </Text>
          <Text style={[typography.caption, styles.lifecycleHint]}>
            Track the order lifecycle:
          </Text>
          <View style={styles.lifecycleRow}>
            <View style={styles.grow}>
              <PrimaryButton
                variant="secondary"
                label="Ship"
                onPress={() => onOrderLifecycle('ship')}
              />
            </View>
            <View style={styles.grow}>
              <PrimaryButton
                variant="secondary"
                label="Deliver"
                onPress={() => onOrderLifecycle('deliver')}
              />
            </View>
          </View>
          <View style={styles.lifecycleRow}>
            <View style={styles.grow}>
              <PrimaryButton
                variant="secondary"
                label="Return"
                onPress={() => onOrderLifecycle('return')}
              />
            </View>
            <View style={styles.grow}>
              <PrimaryButton
                variant="secondary"
                label="Exchange"
                onPress={() => onOrderLifecycle('exchange')}
              />
            </View>
            <View style={styles.grow}>
              <PrimaryButton
                variant="danger"
                label="Cancel"
                onPress={() => onOrderLifecycle('cancel')}
              />
            </View>
          </View>
        </View>
      ) : null}

      {cart.count === 0 ? (
        <View style={styles.empty}>
          <Text style={typography.body}>Your cart is empty.</Text>
          <Text style={typography.caption}>Add dishes from a restaurant to get started.</Text>
        </View>
      ) : (
        <ScreenSection title="Items">
          {cart.lines.map(line => (
            <Card key={line.item.id} style={styles.lineCard}>
              <Image source={{ uri: line.item.imageUrl }} style={styles.lineImage} />
              <View style={styles.lineBody}>
                <Text style={typography.body}>{line.item.name}</Text>
                <Text style={typography.caption}>
                  Qty {line.quantity} · ${(line.item.price * line.quantity).toFixed(2)}
                </Text>
              </View>
              <View style={styles.removeButton}>
                <PrimaryButton
                  variant="danger"
                  label="Remove"
                  onPress={() => cart.remove(line.item.id)}
                />
              </View>
            </Card>
          ))}

          <View style={styles.totals}>
            <Text style={typography.heading}>Subtotal</Text>
            <Text style={typography.heading}>${cart.subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.checkoutRow}>
            <View style={styles.grow}>
              <PrimaryButton label="Checkout" onPress={onCheckout} />
            </View>
            <View style={styles.grow}>
              <PrimaryButton variant="secondary" label="Clear cart" onPress={cart.clear} />
            </View>
          </View>
          {/* OrderEvent · preorder */}
          <PrimaryButton
            variant="secondary"
            label="Pre-order for later"
            onPress={onPreorder}
          />
          {/* CartEvent · replace */}
          <PrimaryButton
            variant="secondary"
            label="Reorder"
            onPress={cart.reorder}
          />
        </ScreenSection>
      )}

      {/* Preview any campaign targeting this screen's zone. */}
      <PreviewBar onApplied={onPreviewApplied} />

      {/* Recommendations ContentZone for cart add-ons. */}
      <LabeledContentZone
        name="cart_addons"
        allowedComponents={addonsZone}
        controller={addonsController}
        previewNonce={previewNonce}
        fallbackContent={addonsFallback}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg },
  confirmation: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: '#E9F7EF',
    borderWidth: 1,
    borderColor: colors.success,
  },
  confirmationTitle: { ...typography.heading, color: colors.success },
  lifecycleHint: { marginTop: spacing.sm },
  lifecycleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  lineCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  lineImage: { width: 64, height: 64 },
  lineBody: { flex: 1, padding: spacing.md, gap: spacing.xs },
  removeButton: { padding: spacing.md, minWidth: 100 },
  totals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  grow: { flex: 1 },
});
