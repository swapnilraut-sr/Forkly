# Launch Forkly in the Android Emulator (Mac)

No phone or GitHub account needed. Each step says how to skip it if already done. First-time setup and the first build are slow (large downloads; first build 10–20 min); later runs are fast.

**Terminal basics:** open with `Cmd+Space` → type `Terminal` → Return. Paste a command (`Cmd+V`), press Return, wait. `sudo` asks for your Mac password (no characters show — that's normal).

---

### 1. Install Homebrew
Skip if `brew --version` prints a version.
```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Then run the 2 **"Next steps"** commands it prints, and reopen Terminal.

### 2. Install Node + Watchman
Skip if `node --version` shows v18+.
```sh
brew install node watchman
```

### 3. Install Android Studio
Skip if already installed (open it → **Help → Check for Updates**).
```sh
brew install --cask android-studio
```
*(Or download from https://developer.android.com/studio.)* It bundles the required Java (JDK 17).

### 4. First launch → Setup Wizard
Open Android Studio → run the **Standard** setup wizard → let it finish downloading the base SDK + emulator. Skip if it opens straight to the Welcome screen.

### 5. Install the exact SDK pieces Forkly needs
Open **SDK Manager** (Welcome screen → **More Actions → SDK Manager**). Tick **Show Package Details**, then install:
- **SDK Platforms:** Android SDK Platform **37**
- **SDK Tools:** Build-Tools **36.0.0** · NDK **27.1.12297006** · Command-line Tools · Platform-Tools · Android Emulator

Click **Apply** to download.

### 6. Set the SDK path
Skip if `echo $ANDROID_HOME` prints a path ending in `Library/Android/sdk`.
```sh
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc
```

### 7. Create + start a virtual phone
Android Studio → **More Actions → Virtual Device Manager** → **Create Device** → pick **Pixel 7** → pick a system image (API **34+**, download if needed) → **Finish** → click **▶** to boot it. Leave the phone window open.

### 8. Download the code
```sh
cd ~/Documents
git clone https://github.com/swapnilraut-sr/Forkly.git
cd Forkly
```
*(No Terminal? Open the repo → green **Code** → **Download ZIP** → unzip into Documents → use `cd ~/Documents/Forkly-main` instead.)*

### 9. Install dependencies
```sh
npm install
```

### 10. Launch (emulator from step 7 must be running)
```sh
npm run android
```
First build takes 10–20 min (normal). Forkly opens on the emulator. Leave the **Metro** window running.

---

### Next time
Start the emulator (Android Studio → Device Manager → ▶), then:
```sh
cd ~/Documents/Forkly && npm run android
```
Code edits reload automatically on save.

### Troubleshooting
| Problem | Fix |
|---|---|
| `command not found: brew` | Reopen Terminal. |
| `SDK location not found` / `ANDROID_HOME` | Redo step 6, reopen Terminal. |
| `No connected devices` | Start the emulator first (step 7). |
| Build fails on SDK 37 / build-tools / NDK | Install the exact versions in step 5 via SDK Manager. |
| `port 8081 already in use` | Close the Metro window, re-run `npm run android`. |

Still stuck? Screenshot the error (**Cmd+Shift+4**, **Spacebar**, click window) → send to Swapnil.
