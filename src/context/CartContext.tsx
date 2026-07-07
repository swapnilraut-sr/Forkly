/**
 * Cart state for Forkly.
 *
 * The cart is ordinary app state, but every mutation also emits the matching
 * Personalization commerce event so the SDK's Cart/Order tracking is exercised
 * from real user interactions:
 *   - add item      -> CartEvent(add)
 *   - remove item   -> CartEvent(remove)
 *   - clear         -> CartEvent(remove) per line (no empty-replace exists)
 *   - reorder       -> CartEvent(replace) with the current, non-empty items
 *   - checkout      -> OrderEvent(purchase) or OrderEvent(preorder)
 */

import * as React from 'react';
import type { LineItem, Order } from '@salesforce-personalization/react-native-personalization';
import type { MenuItem } from '../data/catalog';
import {
  trackCartAdd,
  trackCartRemove,
  trackCartReplace,
  trackOrder,
} from '../personalization/sdk';

export type CartLine = { item: MenuItem; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (item: MenuItem) => void;
  remove: (itemId: string) => void;
  clear: () => void;
  reorder: () => void;
  checkout: (kind?: 'purchase' | 'preorder') => Order;
};

const CartContext = React.createContext<CartContextValue | null>(null);

function toLineItem(item: MenuItem, quantity: number): LineItem {
  return {
    catalogObjectType: 'product',
    // Data Cloud Goods Product Id — the catalog object id, not the app id.
    catalogObjectId: item.goodsProductId,
    quantity,
    price: item.price,
    currency: item.currency,
    attributes: { name: item.name, category: item.category, cuisine: item.cuisine },
  };
}

let orderCounter = 1000;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[]>([]);

  const add = React.useCallback((item: MenuItem) => {
    setLines(prev => {
      const existing = prev.find(l => l.item.id === item.id);
      const nextQty = (existing?.quantity ?? 0) + 1;
      // Fire-and-forget commerce event with the resulting quantity.
      trackCartAdd(toLineItem(item, nextQty));
      if (existing) {
        return prev.map(l =>
          l.item.id === item.id ? { ...l, quantity: nextQty } : l,
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  }, []);

  const remove = React.useCallback((itemId: string) => {
    setLines(prev => {
      const existing = prev.find(l => l.item.id === itemId);
      if (existing) {
        trackCartRemove(toLineItem(existing.item, existing.quantity));
      }
      return prev.filter(l => l.item.id !== itemId);
    });
  }, []);

  const clear = React.useCallback(() => {
    setLines(prev => {
      // The SDK's CartEvent(replace) requires a non-empty line-item set (the
      // native bridge rejects an empty array: "lineItems is required for
      // CartEvent replace"), and there is no empty-cart event. Model "clear"
      // the same way the Flutter plugin does — one CartEvent(remove) per line.
      prev.forEach(l => trackCartRemove(toLineItem(l.item, l.quantity)));
      return [];
    });
  }, []);

  // Replace the entire cart with the current contents (e.g. "reorder"),
  // demonstrating CartEvent(replace) with a non-empty line-item set.
  const reorder = React.useCallback(() => {
    setLines(prev => {
      if (prev.length > 0) {
        trackCartReplace(prev.map(l => toLineItem(l.item, l.quantity)));
      }
      return prev;
    });
  }, []);

  const checkout = React.useCallback(
    (kind: 'purchase' | 'preorder' = 'purchase'): Order => {
      orderCounter += 1;
      let order: Order = { id: `FORKLY-${orderCounter}`, lineItems: [] };
      setLines(prev => {
        const lineItems = prev.map(l => toLineItem(l.item, l.quantity));
        const totalValue = prev.reduce(
          (sum, l) => sum + l.item.price * l.quantity,
          0,
        );
        order = {
          id: `FORKLY-${orderCounter}`,
          lineItems,
          totalValue: Math.round(totalValue * 100) / 100,
          currency: 'USD',
          attributes: { channel: 'mobile-app', itemCount: prev.length },
        };
        trackOrder(kind, order);
        return [];
      });
      return order;
    },
    [],
  );

  const value = React.useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((s, l) => s + l.item.price * l.quantity, 0);
    return { lines, count, subtotal, add, remove, clear, reorder, checkout };
  }, [lines, add, remove, clear, reorder, checkout]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
