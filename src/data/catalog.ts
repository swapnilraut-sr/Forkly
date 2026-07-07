/**
 * Static Forkly catalog used to drive the demo UI.
 *
 * This is ordinary app data (restaurants + menu items). The personalization
 * SDK never sources this — it comes from ContentZones. We keep it here so the
 * app looks like a real food-delivery product while we exercise the plugin's
 * event/identity/engagement APIs against realistic entities.
 *
 * ── Source of truth ─────────────────────────────────────────────────────
 * The raw product data lives in `./products.json`, a 1:1 mirror of the Data
 * Cloud Goods Product export. This file only holds TYPES + the transform that
 * shapes that JSON into `restaurants` and `menuItems`. To refresh the catalog,
 * re-export from Data Cloud and overwrite products.json — no code changes.
 *
 * ── Data Cloud identity ─────────────────────────────────────────────────
 * Every menu item carries a `goodsProductId` — the real Data Cloud "Goods
 * Product Id". This is the value we send as `catalogObject.id` on product
 * CatalogEvents and as `catalogObjectId` on Cart/Order line items, so Data
 * Cloud can attribute engagement to the correct product (and infer the
 * food/cuisine category from it for recommendations).
 *
 * The display-facing `id` (e.g. `item-dragon-roll`, `rest-sakura-omakase`) is
 * an APP-LEVEL identifier used only for navigation and local lookup. It is
 * deliberately kept SEPARATE from the backend `goodsProductId`.
 *
 * Restaurants have no Data Cloud id of their own — in the data model a
 * restaurant/cuisine is a category (Category2/Category3), not a catalog
 * object. Restaurant-level events therefore keep using the app-level `rest-*`
 * id purely for tracking/navigation context.
 */

import productsData from './products.json';

export type MenuItem = {
  /** App-level display/navigation id (NOT the Data Cloud id). */
  id: string;
  /**
   * Data Cloud "Goods Product Id" — the catalog object id sent on product
   * CatalogEvents and Cart/Order line items. This is the backend identity.
   */
  goodsProductId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  /** Menu section / food type (from Category2), e.g. "Appetizers", "Mains". */
  category: string;
  /** Cuisine (from the product's primary category), e.g. "Italian". */
  cuisine: string;
  /** App-level restaurant id this item belongs to. */
  restaurantId: string;
};

export type Restaurant = {
  /** App-level display/navigation id (NOT a Data Cloud id). */
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  etaMinutes: number;
  deliveryFee: number;
  imageUrl: string;
  tags: string[];
};

/** Shape of one row in products.json (mirrors the Goods Product export). */
type ProductSeed = {
  goodsProductId: string;
  productName: string;
  cuisine: string;
  category: string;
  restaurant: string;
  photo: string;
  price: number;
};

type RestaurantMeta = {
  rating: number;
  etaMinutes: number;
  deliveryFee: number;
  tags: string[];
};

const PRODUCT_SEEDS = productsData.products as ProductSeed[];
const RESTAURANT_META = productsData.restaurantMeta as Record<
  string,
  RestaurantMeta
>;

// Deterministic Unsplash-style food imagery (stable URLs, no API key needed).
// The seed values are the exact photo slugs from the Goods Product export.
const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=600&q=60`;

/** URL/id-safe slug: strips accents, lowercases, hyphenates. */
function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // drop diacritics (é, ù, ê, …)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Singularize a menu-section label for readable auto-descriptions. */
function categoryNoun(category: string): string {
  const map: Record<string, string> = {
    Appetizers: 'appetizer',
    Mains: 'main',
    'Main Course': 'main course',
    Sides: 'side',
    Rolls: 'roll',
    Salads: 'salad',
    Bowls: 'bowl',
    Desserts: 'dessert',
    Pastries: 'pastry',
    Drinks: 'drink',
    Smoothies: 'smoothie',
  };
  return map[category] ?? category.toLowerCase();
}

// ── Build restaurants + menu items from the seed (deterministic order) ──────
const restaurantIdByName: Record<string, string> = {};
const _restaurants: Restaurant[] = [];

for (const seed of PRODUCT_SEEDS) {
  if (restaurantIdByName[seed.restaurant]) {
    continue;
  }
  const id = `rest-${slugify(seed.restaurant)}`;
  restaurantIdByName[seed.restaurant] = id;
  const meta = RESTAURANT_META[seed.restaurant];
  _restaurants.push({
    id,
    name: seed.restaurant,
    cuisine: seed.cuisine,
    rating: meta?.rating ?? 4.5,
    etaMinutes: meta?.etaMinutes ?? 30,
    deliveryFee: meta?.deliveryFee ?? 2.99,
    // Hero image = the restaurant's first product photo.
    imageUrl: img(seed.photo),
    tags: meta?.tags ?? [seed.cuisine],
  });
}

const usedItemIds = new Set<string>();
const _menuItems: MenuItem[] = PRODUCT_SEEDS.map(seed => {
  // Unique, readable, app-level display id (kept separate from goodsProductId).
  let id = `item-${slugify(seed.productName)}`;
  if (usedItemIds.has(id)) {
    let n = 2;
    while (usedItemIds.has(`${id}-${n}`)) {
      n += 1;
    }
    id = `${id}-${n}`;
  }
  usedItemIds.add(id);

  return {
    id,
    goodsProductId: seed.goodsProductId,
    name: seed.productName,
    description: `${seed.cuisine} ${categoryNoun(seed.category)}, crafted in-house.`,
    price: seed.price,
    currency: 'USD',
    imageUrl: img(seed.photo),
    category: seed.category,
    cuisine: seed.cuisine,
    restaurantId: restaurantIdByName[seed.restaurant],
  };
});

export const restaurants: Restaurant[] = _restaurants;
export const menuItems: MenuItem[] = _menuItems;

export const getRestaurant = (id: string): Restaurant | undefined =>
  restaurants.find(r => r.id === id);

export const getMenuItem = (id: string): MenuItem | undefined =>
  menuItems.find(m => m.id === id);

/** Look an item up by its Data Cloud Goods Product Id. */
export const getMenuItemByGoodsProductId = (
  goodsProductId: string,
): MenuItem | undefined =>
  menuItems.find(m => m.goodsProductId === goodsProductId);

/**
 * Resolve a menu item from an id that may be EITHER the app-level display id
 * (`item-…`) or the Data Cloud Goods Product Id. Recommendation/content
 * payloads can key on either, so callers navigating from personalized content
 * should use this to reliably land on the right PDP.
 */
export const resolveMenuItem = (idOrGoodsProductId: string): MenuItem | undefined =>
  getMenuItem(idOrGoodsProductId) ??
  getMenuItemByGoodsProductId(idOrGoodsProductId);

export const getMenuForRestaurant = (restaurantId: string): MenuItem[] =>
  menuItems.filter(m => m.restaurantId === restaurantId);

/** Distinct cuisines present in the catalog (stable first-seen order). */
export const cuisines: string[] = Array.from(
  new Set(restaurants.map(r => r.cuisine)),
);
