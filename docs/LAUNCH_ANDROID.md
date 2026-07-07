# 🤖 Launch Forkly in the Android Emulator (Mac)

Hi! This guide will walk you through running the **Forkly** app on your Mac, inside a piece of software that pretends to be an Android phone (an "Android Emulator" — no physical phone needed, and no GitHub account needed either).

A few honest expectations before you start:

- **The first time through this guide will take a while.** Android Studio and the Android SDK are big downloads, and the very first build of the app can take **10–20 minutes**. That is completely normal.
- **Every time after that will be much faster** — usually just a couple of minutes.
- You do not need to know how to code. You just need to copy commands, paste them, and press Return. We'll explain every step.

If you get stuck anywhere, jump to the **"If something goes wrong"** section at the bottom — you can always send a screenshot to **Swapnil**.

---

## How to read this guide

This guide has numbered steps. Each step that installs something starts with a line like:

> ✅ **Already have it?** Here's how to check → if so, skip this step.

Please actually check! Many Mac users already have some of this installed. If a check shows you have an **old version**, update it and then move on — don't reinstall from scratch.

### A very quick primer on the Terminal

The "Terminal" app is where you'll type/paste commands. Don't worry, it's not as scary as it looks.

- **To open it:** Press `Cmd + Space` (this opens Spotlight Search), type `Terminal`, and press Return.
- **To run a command in this guide:** Click into the Terminal window, copy the command from the gray box (click the box, select all, `Cmd + C`), paste it into Terminal with `Cmd + V`, then press **Return**. Wait for it to finish — you'll see the cursor become available again (sometimes with a `$` or `%` sign).
- **About passwords:** Sometimes a command (especially ones starting with `sudo`) will ask for "your password." This is your Mac login password. When you type it, **nothing will appear on screen** — no dots, no letters. This is normal and is a security feature. Just type it carefully and press Return.

Okay, let's get started!

---

## Step 1: Open Terminal

Press `Cmd + Space`, type `Terminal`, press Return. Keep this window open — you'll use it throughout this guide.

---

## Step 2: Install Homebrew

Homebrew is a tool that installs other developer tools for us. Think of it as an "App Store" for command-line software.

> ✅ **Already have it?** Run this:
> ```sh
> brew --version
> ```
> If you see a version number (like `Homebrew 4.x.x`), skip to Step 3.

If you get a "command not found" message, install it by pasting this into Terminal and pressing Return:

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

This will ask for your password (remember — no characters show as you type, that's normal) and may take a few minutes.

**Important:** When it finishes, it usually prints a "Next steps" section with **1 or 2 commands** you need to run (something like `echo ... >> ~/.zprofile` and `eval ...`). Copy and run exactly those commands — they add Homebrew to your Terminal's "PATH" so it can be found later. Then **close Terminal completely and reopen it** (Cmd+Space → Terminal again) before continuing.

---

## Step 3: Install Node and Watchman

Node.js lets us run the JavaScript tools this project needs. Watchman helps the app detect when code changes.

> ✅ **Already have it?** Run this:
> ```sh
> node --version
> ```
> If it shows `v18` or higher (e.g. `v20.x.x`), skip to Step 4. If it shows something lower than 18, continue below to update it.

Install both with:

```sh
brew install node watchman
```

---

## Step 4: Install Android Studio

Android Studio is the official Android development app. We need it because it bundles everything required to build and run Android apps, including a compatible version of Java (JDK 17).

> ✅ **Already have it?** Open Android Studio, then go to the menu **Help → Check for Updates**. If it's reasonably current, skip reinstalling — just make sure it opens fine, then move to Step 5.

To install, either:

- **Option A (recommended, easiest):** Go to https://developer.android.com/studio in your browser, download it, open the downloaded file, and drag Android Studio into your Applications folder.
- **Option B (Terminal):**
  ```sh
  brew install --cask android-studio
  ```

This is a large download (over a gigabyte), so it may take some time depending on your internet speed.

---

## Step 5: Run the Android Studio Setup Wizard (first launch only)

Open Android Studio from your Applications folder (or Spotlight: `Cmd + Space`, type "Android Studio").

The first time it opens, it will show a **Setup Wizard**. Choose the **"Standard"** install type and let it finish. It will download:

- The base Android SDK (the software toolkit for building Android apps)
- Platform-tools (command-line helpers)
- A default emulator

> ✅ **Already done this before?** If Android Studio opens straight to a "Welcome" screen without a setup wizard, you've already done this — skip to Step 6.

Just let the wizard finish downloading everything before moving on.

---

## Step 6: Install the specific Android SDK pieces Forkly needs

Forkly's build is pinned to specific versions, so we need to make sure exactly the right pieces are installed.

Open the **SDK Manager**:
- From the Android Studio welcome screen: click **"More Actions" → "SDK Manager"**, **or**
- If a project is already open: **Android Studio menu → Settings (Preferences on some setups) → Languages & Frameworks → Android SDK**

### SDK Platforms tab

Tick the checkbox for **"Show Package Details"** (bottom right) if you don't see individual versions. Then make sure this is checked:

- **Android SDK Platform 37** — this is the specific version of Android that Forkly is built against (this is the Android 15 "VanillaIceCream"-era platform).

### SDK Tools tab

Make sure these are checked:

- **Android SDK Build-Tools 36.0.0** — the tools that actually compile the Android app.
- **NDK (Side by side), version 27.1.12297006** — lets the app use native (non-JavaScript) code, needed for one of Forkly's plugins.
- **Android SDK Command-line Tools** — command-line versions of the SDK tools.
- **Android SDK Platform-Tools** — includes tools like `adb`, used to talk to the emulator.
- **Android Emulator** — the actual virtual-phone software.

Once everything above is checked, click **Apply** (or **OK**), then let it download. This can take a while the first time.

> ✅ **Already have exactly these versions?** Skip ahead to Step 7.

---

## Step 7: Tell the Terminal where to find the Android SDK

Right now, Android Studio knows where the SDK is, but our Terminal commands don't. We fix this by adding a couple of lines to your shell's "profile" file (a file that runs every time you open Terminal).

Most modern Macs use a shell called `zsh`, and its profile file is `~/.zshrc`. Run these commands one at a time:

```sh
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
```

```sh
echo 'export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools' >> ~/.zshrc
```

Then reload it:

```sh
source ~/.zshrc
```

(Or, simpler: just close Terminal completely and reopen it.)

> Note: if you know you're using the older `bash` shell instead of `zsh`, use `~/.bash_profile` in place of `~/.zshrc` above. Most people don't need to worry about this — zsh is the modern Mac default.

> ✅ **Already set these up before?** Run `echo $ANDROID_HOME` — if it prints a path ending in `Library/Android/sdk`, you're done, skip to Step 8.

---

## Step 8: Create a virtual Android phone (the "Emulator")

Now we create the actual virtual phone that Forkly will run on.

1. In Android Studio, click **"More Actions" → "Virtual Device Manager"** (sometimes labeled just **"Device Manager"**).
2. Click **"Create Device"**.
3. Pick a phone model — **Pixel 7** is a good, modern default.
4. Pick a system image (this is the version of Android the virtual phone will run). Choose one with **API level 34 or higher**. If it's not downloaded yet, click the download icon next to it and wait.
5. Click **Finish**.
6. Back in the Device Manager list, click the **▶ (play) button** next to your new virtual device. A phone-shaped window should pop up on your screen — this is your emulator, fully booted and ready.

> ✅ **Already have a virtual device set up?** Just start it with the ▶ button and skip to Step 9.

Leave this virtual phone window open — we'll use it in a moment.

---

## Step 9: Download the Forkly app code

You don't need a GitHub account to do this — the repository is public.

**Option A — using Terminal (recommended):**

```sh
cd ~/Documents
```

```sh
git clone https://github.com/swapnilraut-sr/Forkly.git
```

```sh
cd Forkly
```

**Option B — no Terminal commands, just your browser:**

1. Open https://github.com/swapnilraut-sr/Forkly in your browser.
2. Click the green **"Code"** button, then **"Download ZIP"**.
3. Find the downloaded ZIP file (usually in Downloads) and double-click it to unzip.
4. Move the resulting folder into your Documents folder.
5. Note: it will likely be named `Forkly-main` instead of `Forkly`. That's fine — just remember to use `cd ~/Documents/Forkly-main` instead of `cd ~/Documents/Forkly` in later steps.

---

## Step 10: Install the JavaScript building blocks

Still in Terminal, inside the Forkly folder, run:

```sh
npm install
```

This downloads all the JavaScript packages the app depends on. It might take a minute or two and print a lot of text — that's expected.

---

## Step 11: Launch Forkly on the emulator

Double-check that your virtual phone window from **Step 8** is open and fully booted (you should see an Android home screen). If it's not open, start it now from Android Studio's Device Manager.

Then, in Terminal (still inside the Forkly folder), run:

```sh
npm run android
```

**The first time you run this, it can take 10–20 minutes.** It's building the entire Android app from scratch and downloading a bunch of build tools in the background. This is completely normal — please be patient and let it run. Every time after this will be dramatically faster (usually a minute or two).

When it finishes:
- The **Forkly app will automatically open** inside your Android emulator window.
- A separate Terminal-like window called **"Metro"** will open. **Leave this window running** in the background — it's what feeds live code updates to the app. Don't close it while you're using the app.

🎉 That's it — Forkly is running!

---

## Launching it again later

Once everything above is set up, here's the short version for next time:

1. **Start the emulator:**
   - Open Android Studio → **Device Manager** → click ▶ next to your virtual device, **or**
   - In Terminal, run:
     ```sh
     emulator -list-avds
     ```
     to see your device's name, then:
     ```sh
     emulator -avd <name-you-saw>
     ```
2. **Start the app:**
   ```sh
   cd ~/Documents/Forkly
   ```
   ```sh
   npm run android
   ```

While the app is running, if anyone edits the code and saves, the app will **automatically reload** on its own — no need to repeat these steps.

---

## If something goes wrong

First: take a screenshot of the Terminal window showing the error (`Cmd + Shift + 4`, then press the **spacebar**, then click on the Terminal window — this saves a screenshot of just that window to your Desktop), and send it to **Swapnil**.

Here are some common issues and quick fixes:

| Problem | Likely fix |
|---|---|
| `command not found: brew` | Close and reopen Terminal completely, then try again (Step 2's "next steps" may not have run yet). |
| Errors mentioning `SDK location not found` or `ANDROID_HOME` | Redo Step 7 (the environment variable lines), then fully close and reopen Terminal. |
| `No connected devices` or `No emulators found` | Your virtual phone isn't running — start it from Android Studio's Device Manager (Step 8), then try `npm run android` again. |
| Build fails mentioning SDK 37, build-tools, or NDK version | Open the SDK Manager (Step 6) and double check the exact versions listed there are installed: Platform 37, Build-Tools 36.0.0, NDK 27.1.12297006. |
| `port 8081 already in use` | Close the "Metro" Terminal window from a previous run, then run `npm run android` again. |

You've got this — and remember, the slow part is only the very first time. Good luck! 🤖
