/**
 * Tests for the ContentZone fallback-content builders used when a live zone has
 * no active Data Cloud campaign yet. They should render a valid sample view
 * from real catalog products (never throw) and wire taps back to the item.
 */

import ReactTestRenderer from 'react-test-renderer';
import {
  forklySpotlightFallback,
  forklyFeaturedFallback,
  forklyProductRecsFallback,
} from '../src/personalization/zones';
import { menuItems } from '../src/data/catalog';

test('spotlight fallback renders and taps back a real catalog item', () => {
  const onTap = jest.fn();
  const element = forklySpotlightFallback(onTap);
  expect(element).not.toBeNull();

  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(element!);
  });
  const pressable = tree!.root.findAll(
    node => typeof node.props.onPress === 'function',
  )[0];
  ReactTestRenderer.act(() => {
    pressable.props.onPress();
  });
  expect(onTap).toHaveBeenCalledTimes(1);
  expect(menuItems.some(m => m.id === onTap.mock.calls[0][0].id)).toBe(true);
});

test('featured fallback renders a multi-item rail from the catalog', () => {
  const onTap = jest.fn();
  const element = forklyFeaturedFallback(onTap);
  expect(element).not.toBeNull();

  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(element!);
  });
  const cards = tree!.root.findAll(
    node => typeof node.props.onPress === 'function',
  );
  expect(cards.length).toBeGreaterThan(1);
  ReactTestRenderer.act(() => {
    cards[0].props.onPress();
  });
  expect(onTap).toHaveBeenCalledTimes(1);
  expect(menuItems.some(m => m.id === onTap.mock.calls[0][0].id)).toBe(true);
});

test('product-recs fallback renders and taps back a real catalog item', () => {
  const onTap = jest.fn();
  const element = forklyProductRecsFallback(onTap, 'Add to your order');
  expect(element).not.toBeNull();

  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(element!);
  });
  const cards = tree!.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function',
  );
  expect(cards.length).toBeGreaterThan(0);
  ReactTestRenderer.act(() => {
    cards[0].props.onPress();
  });
  expect(onTap).toHaveBeenCalledTimes(1);
  expect(menuItems.some(m => m.id === onTap.mock.calls[0][0].id)).toBe(true);
});
