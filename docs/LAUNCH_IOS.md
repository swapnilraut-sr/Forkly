# Launch Forkly on iOS (Mac)

Steps 1–6 are the same whether you run in the **Simulator** (no iPhone/Apple ID needed) or on **your iPhone** (needs a free Apple ID) — pick which at step 7. No GitHub account needed. Each step says how to skip it if already done.

**Terminal basics:** open with `Cmd+Space` → type `Terminal` → Return. Paste a command (`Cmd+V`), press Return, wait for the prompt to return. `sudo` asks for your Mac password (no characters show — that's normal).

---

### 1. Install Xcode
Skip if the App Store shows **Open** (already installed) — just **Update** if offered.
Otherwise: App Store → search **Xcode** → **Get** (~10–15 GB). Open it once, click **Agree**, then:
```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```
```sh
sudo xcodebuild -runFirstLaunch
```
(The Simulator is bundled inside Xcode.)

### 2. Install Homebrew
Skip if `brew --version` prints a version.
```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Then run the 2 **"Next steps"** commands it prints, and reopen Terminal.

### 3. Install Node + Watchman
Skip if `node --version` shows v18+.
```sh
brew install node watchman
```

### 4. Install CocoaPods tooling
```sh
sudo gem install bundler
```

### 5. Download the code
```sh
cd ~/Documents
git clone https://github.com/swapnilraut-sr/Forkly.git
cd Forkly
```
*(No Terminal? Open the repo → green **Code** → **Download ZIP** → unzip into Documents → use `cd ~/Documents/Forkly-main` instead.)*

### 6. Install dependencies
```sh
npm install
cd ios && bundle install && bundle exec pod install && cd ..
```
If `pod install` errors: re-run `bundle install`, then `bundle exec pod install`.

### 7. Launch — pick one

#### 7A. Run on the Simulator (no iPhone/Apple ID)
```sh
npm run ios
```
First build takes a few minutes. The Simulator opens and Forkly launches. Leave the **Metro** window running.

#### 7B. Run on your iPhone (free Apple ID)
Needs a USB cable and a free Apple ID. The app expires after 7 days — just re-run to refresh.
1. Plug the iPhone into the Mac; tap **Trust** on the phone.
2. On the iPhone: **Settings → Privacy & Security → Developer Mode → On**, then restart.
3. Open the project in Xcode: `open ios/Forkly.xcworkspace`
4. Click the blue **Forkly** at top → **Signing & Capabilities** → tick **Automatically manage signing** → **Team** → **Add an Account…** → sign in with your Apple ID → select the "(Personal Team)".
5. If it shows a signing error, change **Bundle Identifier** to something unique, e.g. `com.<yourname>.forkly`.
6. Build:
```sh
npm run ios -- --device
```
7. First launch fails as "Untrusted Developer" — on the iPhone: **Settings → General → VPN & Device Management** → tap your Apple ID → **Trust**, then run step 6 again.

---

### Next time
```sh
cd ~/Documents/Forkly && npm run ios          # simulator
cd ~/Documents/Forkly && npm run ios -- --device   # iPhone (re-run weekly to refresh)
```
Code edits reload automatically on save.

### Troubleshooting
| Problem | Fix |
|---|---|
| `command not found: brew` | Reopen Terminal. |
| `pod install` error | Re-run `bundle install`, then `bundle exec pod install`. |
| Simulator didn't open | Re-run `npm run ios`. |
| `port 8081 already in use` | Close the Metro window, re-run `npm run ios`. |
| iPhone: "Untrusted Developer" | Settings → General → VPN & Device Management → tap your Apple ID → Trust. |
| iPhone: bundle ID unavailable | Set a unique Bundle Identifier (`com.<yourname>.forkly`) in Xcode signing. |
| iPhone not listed in Xcode | Unlock phone, tap Trust, enable Developer Mode, reconnect cable. |
| App stopped opening after ~a week | Free Apple ID lasts 7 days — re-run `npm run ios -- --device`. |

Still stuck? Screenshot the error (**Cmd+Shift+4**, **Spacebar**, click window) → send to Swapnil.
