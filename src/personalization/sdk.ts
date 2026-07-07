/**
 * Thin, logged wrapper over the Personalization plugin's public API.
 *
 * Every method here calls straight into `PersonalizationModule` (the public
 * export from `@salesforce-personalization/react-native-personalization`) and mirrors the call
 * into the in-app event log. Screens import from here instead of touching the
 * module directly, which keeps interaction code readable and gives us one place
 * that demonstrates the full public surface:
 *
 *   Identity   setProfileId/getProfileId, setAttribute(s)/getAttributes,
 *              clearAttribute/clearAllAttributes, party identification getters/setters
 *   Events     track() for Custom / Engagement / System / Cart / Order / Catalog events
 *   Consent    setConsent / isConsentOptIn
 *   Preview    handlePreviewUrl / isPreview
 *   Logging    setLogging
 */

import {
  PersonalizationModule as _NativePersonalizationModule,
  type ProfileAttributes,
  type PartyIdentification,
  type LineItem,
  type Order,
  type CatalogObject,
} from '@salesforce-personalization/react-native-personalization';
import { logCall } from './eventLog';
import { baseEventMeta, getSessionId, newEventId, type BaseEventMeta } from './eventMetadata';

// ---------------------------------------------------------------------------
// Raw payload inspector (debug)
// ---------------------------------------------------------------------------
//
// Wrap the native module in a Proxy so EVERY outbound call — track() (cart /
// order / catalog / custom / engagement / system), setProfileId, party
// identification, setConsent, attributes, everything — is logged with its
// FULL, fully-merged wire arguments before it crosses the native bridge.
// This is the single choke point: the individual track* helpers below already
// mirror a *summary* to the Activity screen via logCall(), but this Proxy
// captures the exact object the SDK actually receives. Toggle with the flag.
const LOG_RAW_SDK_PAYLOADS = true;

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const PersonalizationModule: typeof _NativePersonalizationModule = LOG_RAW_SDK_PAYLOADS
  ? new Proxy(_NativePersonalizationModule, {
      get(target, prop, receiver) {
        const orig = Reflect.get(target, prop, receiver);
        if (typeof orig !== 'function') {
          return orig;
        }
        return (...args: unknown[]) => {
          const method = String(prop);
          // Single-arg calls (like track({...})) log the object directly;
          // multi-arg calls (like setAttribute(key, value)) log the arg list.
          const payload = args.length === 1 ? args[0] : args;
          console.log(
            `\n📤 [Forkly→SDK] PersonalizationModule.${method}()\n${safeStringify(payload)}\n`,
          );
          return (orig as (...a: unknown[]) => unknown).apply(target, args);
        };
      },
    })
  : _NativePersonalizationModule;

// ---------------------------------------------------------------------------
// Required-schema metadata helpers
// ---------------------------------------------------------------------------
//
// The backend that ingests `PersonalizationModule.track()` calls enforces a
// fixed set of required metadata fields per event/object shape. None of the
// typed objects (LineItem/Order/CatalogObject) or name-based events carry
// these fields by default — the only channel available to attach them is
// each object's free-form `attributes` bag (see eventMetadata.ts for the
// full rationale). Every track* helper below builds the required metadata
// via `baseEventMeta()` and merges it into the relevant attributes bag,
// without clobbering caller-supplied attributes (name/category/price/etc.)
// unless a caller key happens to collide with a required schema key, in
// which case the schema value wins.

type Attrs = Record<string, string | number | boolean>;

function mergeAttrs(callerAttrs: Attrs | undefined, meta: Attrs): Attrs {
  return { ...callerAttrs, ...meta };
}

const ORDER_SUBTYPE_LABEL: Record<string, string> = {
  purchase: 'Purchase',
  preorder: 'Preorder',
  cancel: 'Cancel',
  ship: 'Ship',
  deliver: 'Deliver',
  return: 'Return',
  exchange: 'Exchange',
};

const CATALOG_SUBTYPE_LABEL: Record<string, string> = {
  comment: 'Comment',
  view: 'View',
  quickView: 'Quick View',
  viewDetail: 'View Detail',
  favorite: 'Favorite',
  share: 'Share',
  review: 'Review',
};

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

export type LogLevel = 'DEBUG' | 'WARN' | 'ERROR' | 'NONE';

export async function setLogging(level: LogLevel): Promise<void> {
  await PersonalizationModule.setLogging(level);
  logCall('logging', `setLogging("${level}")`);
}

// ---------------------------------------------------------------------------
// Identity — profile id + attributes
// ---------------------------------------------------------------------------

export async function setProfileId(profileId: string): Promise<void> {
  await PersonalizationModule.setProfileId(profileId);
  // `setProfileId` has no `attributes` bag and does not go through track(),
  // so there is no wire channel on this call to attach the required Identity
  // Profile metadata (dateTime/deviceId/eventId/eventType/interactionName/
  // isAnonymous/sessionId). We still construct the full metadata object and
  // log it via logCall so the intended payload is verifiable/inspectable in
  // the Activity screen, and so a future backend hook (e.g. a dedicated
  // identity track call) has a ready-made shape to send.
  const identityMeta = {
    ...baseEventMeta('identity', 'Set Profile Id'),
    isAnonymous: profileId ? 'false' : 'true',
  };
  logCall('identity', 'setProfileId', { profileId, ...identityMeta });
}

export async function getProfileId(): Promise<string | null> {
  const id = await PersonalizationModule.getProfileId();
  logCall('identity', 'getProfileId', { profileId: id });
  return id;
}

export async function setAttribute(key: string, value: string): Promise<void> {
  await PersonalizationModule.setAttribute(key, value);
  logCall('identity', 'setAttribute', { [key]: value });
}

export async function setAttributes(attrs: ProfileAttributes): Promise<void> {
  await PersonalizationModule.setAttributes(attrs);
  logCall('identity', 'setAttributes', attrs as Record<string, unknown>);
}

export async function getAttributes(): Promise<ProfileAttributes> {
  const attrs = await PersonalizationModule.getAttributes();
  logCall('identity', 'getAttributes', attrs as Record<string, unknown>);
  return attrs;
}

export async function clearAttribute(key: string): Promise<void> {
  await PersonalizationModule.clearAttribute(key);
  logCall('identity', 'clearAttribute', { key });
}

export async function clearAllAttributes(): Promise<void> {
  await PersonalizationModule.clearAllAttributes();
  logCall('identity', 'clearAllAttributes');
}

// ---------------------------------------------------------------------------
// Identity — party identification
// ---------------------------------------------------------------------------

export async function setPartyIdentification(
  party: PartyIdentification,
): Promise<void> {
  if (party.name !== undefined) {
    await PersonalizationModule.setPartyIdentificationName(party.name);
  }
  if (party.number !== undefined) {
    await PersonalizationModule.setPartyIdentificationNumber(party.number);
  }
  if (party.type !== undefined) {
    await PersonalizationModule.setPartyIdentificationType(party.type);
  }
  // Same story as setProfileId: no attributes bag / no track() path exists
  // for party identification, so we build the full Identity Profile metadata
  // object and log it via logCall so the payload backend teams expect is at
  // least verifiable from the Activity screen.
  const identityMeta = {
    ...baseEventMeta('identity', 'Set Party Identification'),
    isAnonymous: party.name === undefined && party.number === undefined ? 'true' : 'false',
  };
  logCall('identity', 'setPartyIdentification', {
    ...(party as Record<string, unknown>),
    ...identityMeta,
  });
}

export async function getPartyIdentification(): Promise<{
  name: string | null;
  number: string | null;
  type: string | null;
}> {
  const [name, number, type] = await Promise.all([
    PersonalizationModule.getPartyIdentificationName(),
    PersonalizationModule.getPartyIdentificationNumber(),
    PersonalizationModule.getPartyIdentificationType(),
  ]);
  const party = { name, number, type };
  logCall('identity', 'getPartyIdentification', party);
  return party;
}

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

export async function setConsent(optIn: boolean): Promise<void> {
  await PersonalizationModule.setConsent(optIn);
  logCall('consent', `setConsent(${optIn ? 'OPT_IN' : 'OPT_OUT'})`);
}

export async function isConsentOptIn(): Promise<boolean> {
  const optedIn = await PersonalizationModule.isConsentOptIn();
  logCall('consent', 'isConsentOptIn', { optedIn });
  return optedIn;
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export async function handlePreviewUrl(url: string): Promise<void> {
  await PersonalizationModule.handlePreviewUrl(url);
  logCall('preview', 'handlePreviewUrl', { url });
}

export async function isPreview(contentZoneName: string): Promise<boolean> {
  const preview = await PersonalizationModule.isPreview(contentZoneName);
  logCall('preview', 'isPreview', { contentZoneName, preview });
  return preview;
}

// ---------------------------------------------------------------------------
// Events — one helper per event type in the SFMCEvent union
// ---------------------------------------------------------------------------

export async function trackCustom(
  name: string,
  attributes?: Record<string, string | number | boolean>,
): Promise<void> {
  await PersonalizationModule.track({ objType: 'CustomEvent', name, attributes });
  logCall('event', `CustomEvent · ${name}`, attributes);
}

export async function trackEngagementEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>,
): Promise<void> {
  await PersonalizationModule.track({ objType: 'EngagementEvent', name, attributes });
  logCall('event', `EngagementEvent · ${name}`, attributes);
}

export async function trackSystem(
  name: string,
  attributes?: Record<string, string | number | boolean>,
): Promise<void> {
  await PersonalizationModule.track({ objType: 'SystemEvent', name, attributes });
  logCall('event', `SystemEvent · ${name}`, attributes);
}

/**
 * Applies the "Cart Item Engagement" schema to a single line item's
 * attributes, given the *parent* Cart Engagement event's metadata.
 *
 * A CartEvent has only ONE attributes bag on the wire — the lineItem's (there
 * is no top-level `attributes` on CartAddEvent/CartRemoveEvent/CartReplaceEvent)
 * — so this bag has to double up and carry both the Cart Engagement fields
 * (dateTime/deviceId/eventType/interactionName/sessionId) and the Cart Item
 * Engagement fields (same set + quantity). `interactionName` therefore must
 * be the real cart ACTION name ('Add to Cart'/'Remove from Cart'/'Replace
 * Cart'), taken as-is from `cartMeta` — never overridden with a generic
 * per-item label, or the action is lost on the wire.
 *
 * `eventId` is the one field that must NOT be shared across items: each line
 * item mints its own fresh eventId (mirroring how trackOrder gives each
 * order item its own eventId) so a batch of items in a single replace call
 * doesn't collide/dedup on the backend. dateTime/deviceId/sessionId remain
 * shared from the parent cart event, as those are correctly common to every
 * item in the same action.
 */
function withCartItemMeta(lineItem: LineItem, cartMeta: BaseEventMeta): LineItem {
  return {
    ...lineItem,
    attributes: mergeAttrs(lineItem.attributes, {
      ...cartMeta,
      eventId: newEventId(),
      quantity: lineItem.quantity,
    }),
  };
}

export async function trackCartAdd(lineItem: LineItem): Promise<void> {
  const interactionName = 'Add to Cart';
  const cartMeta = baseEventMeta('cart', interactionName);
  const itemWithMeta = withCartItemMeta(lineItem, cartMeta);
  await PersonalizationModule.track({ objType: 'CartEvent', subtype: 'add', lineItem: itemWithMeta });
  logCall('event', 'CartEvent · add', {
    item: lineItem.catalogObjectId,
    qty: lineItem.quantity,
    ...cartMeta,
  });
}

export async function trackCartRemove(lineItem: LineItem): Promise<void> {
  const interactionName = 'Remove from Cart';
  const cartMeta = baseEventMeta('cart', interactionName);
  const itemWithMeta = withCartItemMeta(lineItem, cartMeta);
  await PersonalizationModule.track({ objType: 'CartEvent', subtype: 'remove', lineItem: itemWithMeta });
  logCall('event', 'CartEvent · remove', { item: lineItem.catalogObjectId, ...cartMeta });
}

export async function trackCartReplace(lineItems: LineItem[]): Promise<void> {
  const interactionName = 'Replace Cart';
  const cartMeta = baseEventMeta('cart', interactionName);
  // Each call to withCartItemMeta mints its own eventId (see above), so every
  // item in the batch gets a unique eventId even though they share the same
  // cartMeta (dateTime/deviceId/eventType/interactionName/sessionId).
  const itemsWithMeta = lineItems.map(item => withCartItemMeta(item, cartMeta));
  await PersonalizationModule.track({ objType: 'CartEvent', subtype: 'replace', lineItems: itemsWithMeta });
  logCall('event', 'CartEvent · replace', { count: lineItems.length, ...cartMeta });
}

export async function trackOrder(
  subtype: 'purchase' | 'preorder' | 'cancel' | 'ship' | 'deliver' | 'return' | 'exchange',
  order: Order,
): Promise<void> {
  const interactionName = ORDER_SUBTYPE_LABEL[subtype] ?? subtype;
  const orderMeta = baseEventMeta('order', interactionName);
  const category = 'order';

  const orderWithMeta: Order = {
    ...order,
    attributes: mergeAttrs(order.attributes, {
      ...orderMeta,
      category,
      orderId: order.id,
    }),
    lineItems: order.lineItems.map(item => ({
      ...item,
      attributes: mergeAttrs(item.attributes, {
        catalogObjectId: item.catalogObjectId,
        category,
        dateTime: orderMeta.dateTime,
        deviceId: orderMeta.deviceId,
        eventId: newEventId(),
        eventType: orderMeta.eventType,
        interactionName: orderMeta.interactionName,
        orderEventId: orderMeta.eventId,
        quantity: item.quantity,
        sessionId: orderMeta.sessionId,
      }),
    })),
  };

  await PersonalizationModule.track({ objType: 'OrderEvent', subtype, order: orderWithMeta });
  logCall('event', `OrderEvent · ${subtype}`, {
    id: order.id,
    total: order.totalValue,
    currency: order.currency,
    // Include the line items (with price + currency per item) so the summary
    // reflects what's actually on the wire, not just the order-level fields.
    lineItems: order.lineItems.map(li => ({
      catalogObjectId: li.catalogObjectId,
      quantity: li.quantity,
      price: li.price,
      currency: li.currency,
    })),
    ...orderMeta,
    category,
    orderId: order.id,
  });
}

export async function trackCatalog(
  subtype: 'comment' | 'view' | 'quickView' | 'viewDetail' | 'favorite' | 'share' | 'review',
  catalogObject: CatalogObject,
): Promise<void> {
  const interactionName = CATALOG_SUBTYPE_LABEL[subtype] ?? subtype;
  const sessionId = getSessionId();
  const catalogMeta: Attrs = {
    id: catalogObject.id,
    interactionName,
    sessionId,
    type: catalogObject.type,
  };

  const catalogObjectWithMeta: CatalogObject = {
    ...catalogObject,
    attributes: mergeAttrs(catalogObject.attributes, catalogMeta),
  };

  await PersonalizationModule.track({ objType: 'CatalogEvent', subtype, catalogObject: catalogObjectWithMeta });
  logCall('event', `CatalogEvent · ${subtype}`, {
    type: catalogObject.type,
    id: catalogObject.id,
    ...catalogMeta,
  });
}
