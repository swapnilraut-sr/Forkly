# Running Forkly on an iPhone (Mac + free Apple ID)

This guide gets **Forkly** running on a physical iPhone from a Mac, using a **free
Apple ID** (no paid Apple Developer account needed).

> ⚠️ **Important:** Forkly is a *bare* React Native app with a **native module**
> (`@salesforce-personalization/react-native-personalization`). That means:
> - **Expo Go does NOT work** — the app must be compiled natively in Xcode.
> - A **Mac is required** to build for iOS. Windows/Linux cannot build iOS apps.
> - With a **free** Apple ID the installed app **expires after 7 days**. To keep
>   using it, just re-run the build (Step 6) — it re-signs for another 7 days.
>   A paid Apple Developer account ($99/yr) removes the 7-day limit and unlocks
>   TestFlight, but is not required to test.

---

## What you'll do (overview)

1. Install the tools (Node, Watchman, Xcode, Ruby/CocoaPods) — **one time**.
2. Clone the repo.
3. Install JS + native (Pods) dependencies.
4. Open the project in Xcode and set up **free** code signing.
5. Trust the developer profile on the iPhone.
6. Build & launch on the phone.

Steps 1 and 4 are the only fiddly parts; the rest is copy-paste.

---

## 0. Prerequisites

- A **Mac** (macOS).
- An **iPhone** + a **USB cable** to connect it to the Mac.
- A free **Apple ID** (the one used for the App Store is fine).

---

## 1. Install the tools (one time)

Open the **Terminal** app and run these.

**a) Xcode** — install from the Mac App Store (search "Xcode"). It's large
(~10 GB), so start this first. After it installs, open it once to accept the
license, then run:

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

**b) Homebrew** (package manager) — if you don't have it:

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the final "Next steps" it prints to add `brew` to your PATH.

**c) Node (LTS) + Watchman:**

```sh
brew install node watchman
```

**d) Ruby & CocoaPods** — the project pins Ruby gems via a `Gemfile` (Bundler).
The macOS system Ruby usually works:

```sh
sudo gem install bundler
```

If you later hit Ruby errors, install a newer Ruby with `brew install ruby` and
re-open Terminal — but try the system Ruby first.

---

## 2. Clone the repo

```sh
cd ~/Documents
git clone https://github.com/swapnilraut-sr/Forkly.git
cd Forkly
```

---

## 3. Install dependencies

```sh
# JavaScript dependencies
npm install

# iOS native dependencies (CocoaPods). First install the pinned gems, then pods.
cd ios
bundle install
bundle exec pod install
cd ..
```

`pod install` can take a few minutes the first time. When it finishes you'll have
`ios/Forkly.xcworkspace`.

---

## 4. Open in Xcode and set up free signing

```sh
open ios/Forkly.xcworkspace
```

> Always open the **`.xcworkspace`**, never the `.xcodeproj`.

In Xcode:

1. In the left sidebar, click the blue **Forkly** project at the top.
2. Select the **Forkly** target → **Signing & Capabilities** tab.
3. Check **✅ Automatically manage signing**.
4. **Team:** click the dropdown → **Add an Account…** → sign in with the free
   Apple ID → then pick that team (it shows as *"Your Name (Personal Team)"*).
5. **Bundle Identifier:** the default is `org.reactjs.native.example.Forkly`,
   which a free Apple ID often **rejects as already in use**. If you see a
   signing error, change it to something unique, e.g.:
   ```
   com.<yourname>.forkly
   ```
   (replace `<yourname>` with anything unique — letters/numbers only).

When the red signing errors clear, you're ready.

---

## 5. Plug in the iPhone and trust it

1. Connect the iPhone to the Mac with the cable. Tap **Trust** on the phone if
   prompted.
2. On the iPhone, enable **Developer Mode**: **Settings → Privacy & Security →
   Developer Mode → On**, then restart the phone when it asks. (iOS 16+.)
3. In Xcode's top toolbar, click the device selector (next to the scheme) and
   choose your **iPhone** (not a simulator).

---

## 6. Build & launch

From the project root in Terminal:

```sh
npm run ios -- --device
```

…or simply press the **▶ (Run)** button in Xcode.

The **first launch on the phone** will fail with *"Untrusted Developer"* — this
is expected with a free Apple ID. Fix it once:

- On the iPhone: **Settings → General → VPN & Device Management** → tap your
  Apple ID under *Developer App* → **Trust**.

Then run again / re-press ▶. Forkly launches on the phone. 🎉

A **Metro** bundler window opens in Terminal and serves the JavaScript — keep it
running while testing. Shake the phone (or press <kbd>d</kbd> in the Metro
window) for the dev menu / reload.

---

## Editing code and seeing changes

- **JavaScript/TypeScript changes** (anything in `src/`, screens, components):
  just save the file — Metro **hot-reloads** it on the phone instantly. No
  rebuild needed.
- **Native changes** (new native dependency, iOS config): re-run
  `bundle exec pod install` in `ios/`, then rebuild (Step 6).
- **After 7 days**, when the app stops opening ("app is no longer available"),
  re-run Step 6 to re-sign for another 7 days.

Quick sanity checks before building:

```sh
npm test        # 23 tests should pass
npm run lint    # linting
```

---

## Common issues

| Symptom | Fix |
|---|---|
| `pod install` fails with Ruby/gem errors | Run `cd ios && bundle install` first (installs pinned CocoaPods), then `bundle exec pod install`. |
| Signing error: bundle id unavailable | Change Bundle Identifier to a unique `com.<yourname>.forkly` (Step 4.5). |
| "Untrusted Developer" on launch | Trust the profile: Settings → General → VPN & Device Management (Step 6). |
| iPhone not listed in Xcode | Unlock the phone, tap **Trust**, enable **Developer Mode** (Step 5), reconnect cable. |
| App stopped opening after ~a week | Free-ID certs last 7 days — just rebuild (Step 6). |
| Metro port already in use | Kill the old bundler: `killall node` (or close the Metro Terminal window), then retry. |

---

## If you'd rather not deal with builds

If the goal is *just to test* rather than to build, the easiest path is:
**someone with an Apple Developer account ($99/yr) uploads a build to TestFlight**,
and you install Apple's **TestFlight** app and tap Install — zero setup on your
side. Ask the repo owner if that's preferred.
