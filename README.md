# Forkly 🍴

A React Native food-delivery demo app that exercises **every public API** of the
[`react-native-salesforce-personalization`](https://www.npmjs.com/package/react-native-salesforce-personalization)
plugin (v1.0.0). It's built to look and feel like a real consumer app while
giving a reviewer a hands-on way to drive the whole SDK surface and watch each
call in a live activity log.

- **React Native 0.81** on the **New Architecture** (TurboModules + Fabric, Hermes)
- **React Navigation v6** — bottom tabs (Home · Browse · Cart · Account) + native stacks
- Consumes the plugin as a **real npm customer** would — installed from the packed
  tarball (`react-native-salesforce-personalization-1.0.0.tgz`), not a workspace link
- Native SDK init is owned by the **host app** (no JS-side `configure()`); credentials
  live in `Info.plist` (iOS) and `AndroidManifest.xml` (Android)

---

## What it demonstrates

Every method on `PersonalizationModule` is called from the app and mirrored into
the in-app **Activity log** (Account → *View SDK activity log*):

| Area | APIs exercised | Where |
| --- | --- | --- |
| **Identity — profile** | `setProfileId`, `getProfileId` | Account |
| **Identity — attributes** | `setAttribute`, `setAttributes`, `getAttributes`, `clearAttribute`, `clearAllAttributes` | Account |
| **Identity — party** | `setPartyIdentificationName/Number/Type`, `getPartyIdentificationName/Number/Type` | Account |
| **Consent** | `setConsent`, `isConsentOptIn`, `getDeviceId` | Account |
| **Preview** | `handlePreviewUrl`, `isPreview` | Account + deep links |
| **Logging** | `setLogging` | Account + app bootstrap |
| **Events** | `track()` for `CustomEvent`, `EngagementEvent`, `SystemEvent`, `CartEvent` (add/remove/replace), `OrderEvent`, `CatalogEvent` | across all screens |
| **Content zones** | `<ContentZone>`, `<MockContentZone>`, `useContentZoneController`, OOTB `Banner()` / `Recommendations()`, custom components | Home / Browse / RestaurantDetail / DishDetail / Cart |

All emitted event names are prefixed with the app name (e.g.
`forkly_banner_tap`, `forkly_app_launched`) so they're easy to spot in
downstream analytics. `CartEvent` / `OrderEvent` / `CatalogEvent` use the SDK's
fixed subtype enums; `Custom` / `Engagement` / `System` events take free-form names.

### Content zones used

The app renders these `ContentZone` names. Each is decorated with a `LIVE` /
`MOCK` tag and lists its allowed component names.

| Zone name | Type | Allowed component(s) | Screen |
| --- | --- | --- | --- |
| `home_hero_banner` | live | `SFPBanner` | Home |
| `home_chef_spotlight` | live | custom `DishSpotlight` | Home |
| `home_recommendations` | live | `SFPRecommendations` | Home |
| `home_mock_promo` | mock | `SFPBanner` | Home |
| `browse_category_banner` | live | `SFPBanner` | Browse |
| `restaurant_recommendations` | live | `SFPRecommendations` | RestaurantDetail |
| `dish_pairings` | live | `SFPRecommendations` | DishDetail |
| `cart_addons` | live | `SFPRecommendations` | Cart |

> To see **live** personalized content you must opt consent **in** (Account →
> Consent → *Opt in*) and have matching campaigns configured for these zone names
> in your Personalization org. Without a live campaign, zones show a graceful
> fallback (e.g. *"Cdp consent not opted-in"* until you opt in); `home_mock_promo`
> always renders offline via `MockContentZone`.

---

## Project layout

```
src/
  personalization/
    sdk.ts            Thin, logged wrapper over the entire PersonalizationModule surface
    zones.ts          OOTB Banner/Recommendations factories + custom DishSpotlight + mock content
    eventLog.ts       In-memory activity log feeding the Activity screen
  components/
    LabeledContentZone.tsx   Demo chrome around <ContentZone>/<MockContentZone>
    custom/DishSpotlight.tsx Custom component rendered inside a live zone
    catalog.tsx, ui.tsx      Presentational building blocks
  context/
    PersonalizationContext.tsx  App bootstrap: setLogging, launch event, consent/profile sync,
                                preview deep-link listener
    CartContext.tsx             Cart state + CartEvent tracking
  screens/            Home · Browse · RestaurantDetail · DishDetail · Cart · Account · Activity
  navigation/         Bottom tabs + native stacks + deep-link linking config
  data/               Static restaurant/dish catalog
  theme/              Colors, spacing, typography
```

Screens import from `src/personalization/sdk.ts` rather than touching the module
directly — one place demonstrates the full public surface and logs every call.

---

## Getting started

> Complete the RN [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment)
> guide first. This app uses the New Architecture, which is the RN 0.81 default.

### 1. Install JS deps

```sh
npm install
```

The plugin is referenced in `package.json` as
`"react-native-salesforce-personalization": "file:react-native-salesforce-personalization-1.0.0.tgz"`.
To pick up a new plugin build, re-pack it and reinstall:

```sh
# from the plugin repo
npm pack --pack-destination /path/to/Forkly
# then in Forkly
npm install
```

### 2. iOS

```sh
bundle install            # first time only — installs CocoaPods
bundle exec pod install   # from ios/, or: (cd ios && bundle exec pod install)
npm run ios
```

### 3. Android

```sh
npm run android
```

---

## Configuration

The host app owns native SDK initialization. Personalization credentials are read
from platform config at launch (replace with your own; do not commit real values):

- **iOS** — `ios/Forkly/Info.plist` keys under `com.salesforce.personalization.*`
  (`CDP_APP_ID`, `CDP_ENDPOINT`, `DATASPACE`, `CDN_URL`)
- **Android** — `android/app/src/main/AndroidManifest.xml` `<meta-data>` entries
  under `com.salesforce.personalization.*`

---

## Preview mode (QR / deep link)

Personalization preview links use the `sfp-preview` query token. Forkly registers
two URL schemes on both platforms — **`personalizationdemo://`** (the scheme used
by Personalization preview QR codes) and **`forkly://`** — and forwards any
incoming URL containing `sfp-preview` to `PersonalizationModule.handlePreviewUrl`
automatically (cold start + warm), via the listener in `PersonalizationContext`.

You can also trigger it by hand: **Account → Preview**, paste a preview URL, tap
**Load preview**. Test the deep link from a terminal:

```sh
# iOS Simulator
xcrun simctl openurl booted "personalizationdemo://preview?sfp-preview=<token>"

# Android emulator
adb shell am start -a android.intent.action.VIEW \
  -d "personalizationdemo://preview?sfp-preview=<token>" com.forkly
```

Use `isPreview("<zone_name>")` (Account → Preview) to check whether a given zone
is currently in preview mode.

---

## Running against a specific Metro port

If you already have a Metro instance on `8081` (e.g. another RN project), run
Forkly's Metro on a different port and point the app at it:

```sh
npm start -- --port 8082
```

- **Android** — map the device's `8081` to your Metro port:
  `adb reverse tcp:8081 tcp:8082`
- **iOS** — launch with `RCT_jsLocation=localhost:8082` (or set the bundler port
  in the in-app Dev Menu → *Configure Bundler*).

---

## Notes for the plugin team

Two changes were needed to build the plugin on Android under RN 0.81 + New Arch.
Both look like plugin-side packaging gaps worth upstreaming:

1. **New Arch codegen isn't wired up.** The plugin ships a `codegenConfig` and
   TurboModule specs but its `android/build.gradle` never applies
   `com.facebook.react`, so CMake fails with
   *"add_subdirectory given source .../codegen/jni which is not an existing directory"*.
   Fixed locally by applying the plugin when `newArchEnabled` (as
   react-native-screens / safe-area-context do).
2. **Kotlin metadata version mismatch.** The SDK AAR is compiled with a newer
   Kotlin stdlib than RN 0.81's pinned Kotlin `2.1.20` K2 frontend can read,
   causing a type-checker crash. Fixed locally by bumping `kotlinVersion` in
   `android/build.gradle`.

See the respective `build.gradle` files for the exact diffs and inline rationale.
