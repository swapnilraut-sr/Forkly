# Launch Forkly in the iOS Simulator (Mac)

No iPhone, Apple ID, or GitHub account needed. Each step says how to skip it if already done.

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

### 7. Launch
```sh
npm run ios
```
First build takes a few minutes. The Simulator opens and Forkly launches. Leave the **Metro** window running.

---

### Next time
```sh
cd ~/Documents/Forkly && npm run ios
```
Code edits reload automatically on save.

### Troubleshooting
| Problem | Fix |
|---|---|
| `command not found: brew` | Reopen Terminal. |
| `pod install` error | Re-run `bundle install`, then `bundle exec pod install`. |
| Simulator didn't open | Re-run `npm run ios`. |
| `port 8081 already in use` | Close the Metro window, re-run `npm run ios`. |

Still stuck? Screenshot the error (**Cmd+Shift+4**, **Spacebar**, click window) → send to Swapnil.
