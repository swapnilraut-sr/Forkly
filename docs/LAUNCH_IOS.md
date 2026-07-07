# 📱 Launch Forkly in the iOS Simulator (Mac)

Welcome! This guide will walk you through running the **Forkly** app on your Mac, inside a virtual iPhone called the **iOS Simulator**. No iPhone required, no Apple ID required, and no GitHub account required.

The first time you do this, expect it to take **about 1–1.5 hours** — but almost all of that time is just waiting for one big download (Xcode) to finish in the background. Every time after this first setup, launching Forkly takes **less than a minute**.

You don't need to understand any of the commands below. Just follow along step by step, copy and paste exactly what's shown, and you'll get there.

---

## How to read this guide

- This guide is broken into numbered steps. Some of these tools might **already be installed** on your Mac (maybe someone set it up for you, or you've done developer work before).
- **Every step tells you how to check if it's already done.** If the check shows it's already done, **skip that step** and move to the next one.
- If a check shows the tool is installed but it's an **old version**, just update it, and then you can skip the rest of that step.
- Don't worry about "breaking" anything — these are all standard, safe developer tools.

---

## Opening the Terminal app

Several steps below ask you to type something into an app called **Terminal**. Here's how to open it:

1. Press `Cmd` + `Space` on your keyboard. A search box will pop up.
2. Type `Terminal`.
3. Press `Return` when you see the Terminal app highlighted.

A window with a plain text background will open. This is completely normal — it's just a way to type instructions to your Mac directly.

**How to run a command in Terminal:**

1. Copy the command from this guide (click and drag to select it, then `Cmd` + `C`).
2. Click inside the Terminal window so your cursor is blinking there.
3. Paste it with `Cmd` + `V`.
4. Press `Return` to run it.
5. Wait. Some commands take a few seconds, some take several minutes. You'll know it's done when you see the cursor/prompt (usually your name and a `$`) appear again at the bottom, ready for the next command.

**A note about passwords:** Some commands start with the word `sudo`. When you run one of these, Terminal will ask for **your Mac login password** (the same one you use to unlock your computer). Type it and press `Return`. You will **not see any characters appear** as you type — not even dots. This is normal and is a security feature. Just type carefully and press `Return`.

---

## Step 1: Open Terminal

If you haven't already, open Terminal now using the instructions above. Keep it open — you'll use it for the rest of this guide.

---

## Step 2: Install Xcode

Xcode is Apple's software for building iPhone apps, and it comes with the iOS Simulator built in.

✅ **Already have it?** Open the **App Store** app, click **Updates** in the sidebar, and if Xcode shows up, click **Update**. If Xcode isn't listed there and you're not sure, search for it in the App Store — if it says "Open" (not "Get" or a price), it's already installed. Update it if needed, then skip to Step 3.

If it's not installed:

1. Open the **App Store** app (you can find it with `Cmd` + `Space`, then type "App Store").
2. Search for **Xcode**.
3. Click **Get** (or the download icon) and install it.

⚠️ This is a big download — around **10–15 GB** — so it may take a while depending on your internet speed. This is the main reason first-time setup takes about an hour. You can let it download in the background and continue with other things, but you'll need it finished before Step 8.

Once Xcode is installed:

1. Open Xcode once (search for it with `Cmd` + `Space`). It may ask you to agree to a license — click **Agree**.
2. You can close Xcode after that; you won't need to use it directly.
3. Back in Terminal, run this command to tell your Mac to use Xcode's developer tools:

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

4. Then run this command, which finishes some one-time Xcode setup:

```sh
sudo xcodebuild -runFirstLaunch
```

**Good to know:** The iOS Simulator is already bundled inside Xcode — there's nothing extra to install for it. (The only exception is if you ever need to test an older iOS version; you'd add that from within Xcode via **Xcode > Settings > Components** — but you won't need that for this guide.)

---

## Step 3: Install Homebrew

Homebrew is a tool that makes it easy to install other developer tools on a Mac.

✅ **Already have it?** In Terminal, run:

```sh
brew --version
```

If it prints a version number (like `Homebrew 4.x.x`), you already have it — skip to Step 4.

If instead it says something like "command not found," install it by running:

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

This will take a few minutes. Follow any on-screen prompts (you may need to press `Return` to confirm, and enter your Mac password).

**Important:** When it finishes, Homebrew will print a section called **"Next steps"** with one or two commands it wants you to run (they'll look something like `echo ... >> ~/.zprofile` and `eval ...`). Copy and run **those exact commands** shown in your Terminal window, one at a time.

Then **close the Terminal window completely and open a new one** (`Cmd` + `Space`, type "Terminal") before continuing, so the changes take effect.

---

## Step 4: Install Node and Watchman

Node.js runs the JavaScript side of Forkly, and Watchman helps the app detect file changes.

✅ **Already have it?** In Terminal, run:

```sh
node --version
```

If it prints `v18.x.x` or higher (like `v20.x.x`), skip to Step 5.

Otherwise, install both with Homebrew:

```sh
brew install node watchman
```

---

## Step 5: Install the CocoaPods tooling

Forkly uses some native iPhone code, which is managed by a tool called CocoaPods. CocoaPods itself is installed via a Ruby tool called Bundler. Run:

```sh
sudo gem install bundler
```

(This is quick — usually just a few seconds. Enter your Mac password if asked.)

---

## Step 6: Download the Forkly app code

You don't need a GitHub account for this — the project is public.

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

**Option B — no Terminal commands, using your browser:**

1. Open this link in your web browser: https://github.com/swapnilraut-sr/Forkly
2. Click the green **Code** button, then click **Download ZIP**.
3. Find the downloaded ZIP file (usually in your **Downloads** folder) and double-click it to unzip it.
4. Move the resulting folder into your **Documents** folder.
5. Note: with this method the folder will be named `Forkly-main`, not `Forkly`. In later steps, when this guide says `cd ~/Documents/Forkly`, use `cd ~/Documents/Forkly-main` instead.

---

## Step 7: Install the building blocks

Make sure you're inside the Forkly folder in Terminal (if you just did Step 6, you already are). Run each of these commands **one at a time**, waiting for each to finish before running the next:

```sh
npm install
```

```sh
cd ios
```

```sh
bundle install
```

```sh
bundle exec pod install
```

```sh
cd ..
```

⚠️ **Heads up:** `bundle exec pod install` is the step most likely to hiccup — it's doing a lot of work behind the scenes. If it shows an error:

1. Try running `bundle install` again, then `bundle exec pod install` again.
2. If it still fails, don't worry — just take a screenshot of the error in Terminal and send it to **Swapnil** for help.

---

## Step 8: Launch Forkly

Now for the fun part. Still in the Forkly folder in Terminal, run:

```sh
npm run ios
```

What happens next:

1. The **first time** you run this, it will take **several minutes** — it's compiling the whole app.
2. A window shaped like a phone will pop up — this is the **iOS Simulator**. It will boot up like a real iPhone.
3. Forkly will automatically launch inside it.
4. A second Terminal window will also open, labeled **Metro**. This is normal — **leave it running** in the background. Don't close it while you're using the app.

You can interact with the Simulator using your mouse or trackpad — click and drag the way you'd tap and swipe on a real phone screen.

🎉 That's it — you're running Forkly!

---

## Launching it again later

Once everything is set up, starting Forkly again is quick:

```sh
cd ~/Documents/Forkly
```

```sh
npm run ios
```

It should open much faster this time (often just a few seconds).

**Good to know:** If anyone edits the app's code while it's running, the app will usually auto-reload with the changes as soon as the file is saved — no need to rebuild.

**To close the app:** simply close the Simulator window and the Metro Terminal window.

---

## If something goes wrong

Don't worry — this is completely normal when setting up developer tools for the first time. The easiest way to get help is to take a screenshot of the Terminal window showing the error and send it to **Swapnil**.

**How to screenshot a specific window:** Press `Cmd` + `Shift` + `4`, then press the `Spacebar` (your cursor turns into a little camera), then click on the Terminal window. The screenshot will save to your Desktop.

A few common hiccups and quick fixes:

| Problem | Try this |
|---|---|
| `command not found: brew` | Close Terminal completely and reopen it, then try again. |
| Error during `pod install` | Re-run `bundle install`, then re-run `bundle exec pod install`. |
| Simulator window never opens | Just run `npm run ios` again. |
| Message about "port 8081 already in use" | Close the Metro Terminal window, then run `npm run ios` again. |

If none of these fixes it, screenshot the error and send it to **Swapnil** — don't spend time worrying about it, this kind of thing is easy to fix with a quick look.
