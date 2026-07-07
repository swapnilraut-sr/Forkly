/**
 * Unit tests for the custom ProductRecs ContentZone component that backs the
 * Home screen's "Product_Recommendations" zone (a horizontal product rail
 * replacing the OOTB vertical Recommendations).
 */

import ReactTestRenderer from 'react-test-renderer';
import { ProductRecs } from '../src/components/custom/ProductRecs';
import { forklyProductRecs } from '../src/personalization/zones';

const context = {
  contentSource: 'PRODUCTION' as const,
  personalizationId: 'p-1',
  engagementPayloads: undefined,
};

const sampleJson = JSON.stringify({
  sectionHeader: 'Recommended for you',
  ctaText: 'Order',
  items: [
    {
      id: 'item-dragon-roll',
      name: 'Dragon Roll',
      description: 'Sakura Omakase · 38 min',
      imageUrl: 'https://example.com/dragon.jpg',
      url: 'forkly://dish/item-dragon-roll',
      price: 22,
    },
    {
      id: 'item-pad-thai-goong',
      name: 'Pad Thai Goong',
      imageUrl: 'https://example.com/padthai.jpg',
      url: 'forkly://dish/item-pad-thai-goong',
      price: 18,
    },
  ],
});

test('uses the required wire name "productrecommendations"', () => {
  expect(ProductRecs().name).toBe('productrecommendations');
  expect(forklyProductRecs().name).toBe('productrecommendations');
});

test('validates and models a full recommendations payload', () => {
  const model = ProductRecs().validateAndCreateComponentModel(sampleJson, context);
  expect(model.sectionHeader).toBe('Recommended for you');
  expect(model.items).toHaveLength(2);
  expect(model.items[0].name).toBe('Dragon Roll');
  expect(model.items[0].price).toBe(22);
});

test('rejects an empty or missing items array', () => {
  expect(() =>
    ProductRecs().validateAndCreateComponentModel(
      JSON.stringify({ items: [] }),
      context,
    ),
  ).toThrow(/items/);
});

test('rejects an item missing name or imageUrl', () => {
  expect(() =>
    ProductRecs().validateAndCreateComponentModel(
      JSON.stringify({ items: [{ id: 'x', imageUrl: 'u' }] }),
      context,
    ),
  ).toThrow(/name/);
  expect(() =>
    ProductRecs().validateAndCreateComponentModel(
      JSON.stringify({ items: [{ id: 'x', name: 'No image' }] }),
      context,
    ),
  ).toThrow(/imageUrl/);
});

test('composes without crashing and fires onTap for the tapped item', () => {
  const onTap = jest.fn();
  const component = ProductRecs({ onTap });
  const model = component.validateAndCreateComponentModel(sampleJson, context);

  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(component.compose(model, context));
  });

  // accessibilityRole propagates across node layers; match the unique card
  // label instead to get exactly one node per card.
  const cards = tree!.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.startsWith('Dragon Roll'),
  );
  expect(cards.length).toBeGreaterThan(0);
  ReactTestRenderer.act(() => {
    cards[0].props.onPress();
  });

  expect(onTap).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Dragon Roll' }),
    0,
  );
});
