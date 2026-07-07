/**
 * Unit tests for the custom PromoCard ContentZone component that backs the
 * "Promo_Card" zone (replacing the OOTB Banner).
 */

import * as React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PromoCard } from '../src/components/custom/PromoCard';
import { forklyPromo } from '../src/personalization/zones';

const context = {
  contentSource: 'PRODUCTION' as const,
  personalizationId: 'p-1',
  engagementPayloads: undefined,
};

const sampleJson = JSON.stringify({
  header: 'Get 20% off your first order',
  subheader: 'Dinner is on us tonight.',
  imageUrl: 'https://example.com/pizza.jpg',
  ctaText: 'Grab the deal',
  ctaUrl: 'forkly://promo/first-order',
  promoCode: 'FORK20',
  discountLabel: '20% OFF',
});

test('uses the required wire name "promocard"', () => {
  expect(PromoCard().name).toBe('promocard');
  expect(forklyPromo().name).toBe('promocard');
});

test('validates and models a full promo payload', () => {
  const model = PromoCard().validateAndCreateComponentModel(sampleJson, context);
  expect(model.header).toBe('Get 20% off your first order');
  expect(model.promoCode).toBe('FORK20');
  expect(model.discountLabel).toBe('20% OFF');
  expect(model.ctaUrl).toBe('forkly://promo/first-order');
});

test('rejects payloads without a header', () => {
  expect(() =>
    PromoCard().validateAndCreateComponentModel(JSON.stringify({ subheader: 'x' }), context),
  ).toThrow(/header/);
});

test('composes without crashing and fires onTap with the ctaUrl', () => {
  const onTap = jest.fn();
  const component = PromoCard({ onTap });
  const model = component.validateAndCreateComponentModel(sampleJson, context);

  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(component.compose(model, context));
  });

  // Find the outer Pressable and invoke its onPress.
  const pressable = tree!.root.findAllByProps({ accessibilityRole: 'button' })[0];
  ReactTestRenderer.act(() => {
    pressable.props.onPress();
  });

  expect(onTap).toHaveBeenCalledWith(
    expect.objectContaining({ header: model.header }),
    'forkly://promo/first-order',
  );
});
