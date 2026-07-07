/**
 * Data-integrity tests for the Forkly catalog.
 *
 * Locks in the contract that matters for Data Cloud: every menu item carries a
 * real, unique Goods Product Id (the catalog object id), kept separate from the
 * app-level display id, and every item resolves back to a restaurant.
 */

import productsData from '../src/data/products.json';
import {
  menuItems,
  restaurants,
  cuisines,
  getMenuItem,
  getMenuItemByGoodsProductId,
  getMenuForRestaurant,
  resolveMenuItem,
} from '../src/data/catalog';

const rawProducts = productsData.products;

test('every raw product row has a Goods Product Id', () => {
  for (const p of rawProducts) {
    expect(typeof p.goodsProductId).toBe('string');
    expect(p.goodsProductId.length).toBeGreaterThan(0);
  }
});

test('menu items mirror the source-of-truth product count', () => {
  expect(menuItems.length).toBe(rawProducts.length);
});

test('every menu item carries a unique Goods Product Id', () => {
  const ids = menuItems.map(m => m.goodsProductId);
  expect(ids.every(id => typeof id === 'string' && id.length > 0)).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
});

test('display id is distinct from the backend Goods Product Id', () => {
  for (const m of menuItems) {
    expect(m.id).not.toBe(m.goodsProductId);
    expect(m.id.startsWith('item-')).toBe(true);
  }
});

test('lookup by Goods Product Id returns the matching item', () => {
  const sample = rawProducts[0];
  const found = getMenuItemByGoodsProductId(sample.goodsProductId);
  expect(found).toBeDefined();
  expect(found!.name).toBe(sample.productName);
  expect(found!.goodsProductId).toBe(sample.goodsProductId);
});

test('resolveMenuItem accepts both the display id and the Goods Product Id', () => {
  const item = menuItems[0];
  expect(resolveMenuItem(item.id)?.id).toBe(item.id);
  expect(resolveMenuItem(item.goodsProductId)?.id).toBe(item.id);
  expect(resolveMenuItem('does-not-exist')).toBeUndefined();
});

test('every menu item resolves to a known restaurant', () => {
  const restaurantIds = new Set(restaurants.map(r => r.id));
  for (const m of menuItems) {
    expect(restaurantIds.has(m.restaurantId)).toBe(true);
  }
});

test('each restaurant has at least one menu item', () => {
  for (const r of restaurants) {
    expect(getMenuForRestaurant(r.id).length).toBeGreaterThan(0);
  }
});

test('display ids are unique and resolvable', () => {
  const ids = menuItems.map(m => m.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(getMenuItem(ids[0])).toBeDefined();
});

test('cuisines cover every restaurant', () => {
  expect(cuisines.length).toBeGreaterThan(0);
  for (const r of restaurants) {
    expect(cuisines).toContain(r.cuisine);
  }
});
