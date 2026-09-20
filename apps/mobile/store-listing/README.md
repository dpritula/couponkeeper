# Publishing CouponKeeper to Google Play — asset pack & checklist

Everything needed to submit CouponKeeper to Google Play (Android only — iOS is out of
scope, per `CLAUDE.md`), generated from the app's actual current state: its real icon,
real screenshots, real permissions, and a real signed release build. Nothing here is
placeholder copy pasted from a template.

## What's in this folder

| Path | What it is |
|---|---|
| `listing/title.txt` | Store listing title (25/30 chars) |
| `listing/short-description.txt` | Short description (75/80 chars) |
| `listing/full-description.txt` | Full description (1773/4000 chars) |
| `graphics/icon-512.png` | High-res store icon, 512×512 — copied from the app's own `icon-source/ic_launcher-playstore.png` |
| `graphics/feature-graphic-1024x500.png` | Feature graphic banner, generated from the app's real icon + brand colors/fonts |
| `graphics/screenshots/01–05-*.png` | The 5 screenshots already in `docs/screenshots/` (used in the GitHub README), re-exported at a 2:1 max aspect ratio so Play's upload validator accepts them, with transparency flattened onto the app's own paper background |
| `data-safety-worksheet.md` | Exact answers for Play Console's "Data safety" questionnaire, with reasoning |
| `content-rating-worksheet.md` | Exact answers for the IARC content rating questionnaire |
| `../../../docs/privacy-policy.html` | The required public Privacy Policy page (repo root `docs/`, for GitHub Pages — see step 2) |

Nothing here contains secrets. The release **signing key and its passwords are
deliberately *not* in this folder** — see step 4.

## Step-by-step checklist

### 1. Create your Google Play Console developer account
You don't have one yet, so start this first — it can take time to process.
1. Go to https://play.google.com/console/signup and sign in with the Google account
   you want to own this app (`dpritula@gmail.com` or whichever you prefer — this
   can't easily be changed later).
2. Pay the one-time **$25 USD** registration fee.
3. Complete identity verification (personal or organization account). Google states
   this can take anywhere from a few hours to a few days.
4. Once approved, click **Create app**, set the app name, default language
   (**English**), app/game = **App**, free/paid = **Free** (no in-app purchases exist),
   and accept the declarations.

### 2. Publish the Privacy Policy and get its URL
Play requires a public URL before you can submit — it won't accept a local file.
1. Push the current branch (with `docs/privacy-policy.html`) to GitHub.
2. In the GitHub repo → **Settings → Pages** → under "Build and deployment", set
   **Source: Deploy from a branch**, **Branch: `main`**, folder **`/docs`** → Save.
3. Wait a minute, then your policy is live at:
   `https://dpritula.github.io/couponkeeper/privacy-policy.html`
4. You'll paste this exact URL into Play Console under
   **App content → Privacy policy**.

### 3. Fill in "App content" declarations in Play Console
Use the two worksheets in this folder while filling these in:
- **Privacy policy** → the URL from step 2.
- **Data safety** → follow `data-safety-worksheet.md`. Short version: answer "No data
  collected" — verified true by reading the code, not assumed.
- **Content rating** → follow `content-rating-worksheet.md`. Expected result:
  lowest/general tier (e.g. PEGI 3 / Everyone).
- **Target audience and content** → general/adult audience, not child-directed (see
  bottom of `content-rating-worksheet.md`).
- **Ads** → declare **No ads** (there are none).
- **Government app**, **Financial features**, **News apps**, **COVID-19 tracing** →
  all **No** / not applicable.
- **App category** → recommend **Business** (this is a tool for makers/sellers
  *running* promotions, not a consumer coupon-clipping app — **Shopping** would
  misrepresent the audience and hurt store-algorithm matching).

### 4. Set up release signing — already done locally, back it up now
A dedicated upload keystore was generated and wired into the Gradle build:
- Keystore file: `apps/mobile/android/app/couponkeeper-upload.keystore.jks`
- Credentials: `apps/mobile/android/keystore.properties`
- Both are **git-ignored on purpose** (`apps/mobile/android/.gitignore`) — a signing
  key must never be committed to a repo, especially a public one.
- `apps/mobile/android/app/build.gradle` now reads `keystore.properties` and signs
  the `release` build type automatically when that file is present; the passwords
  were shown once in chat when this was generated.

**Before you do anything else: back up `couponkeeper-upload.keystore.jks` and
`keystore.properties` somewhere outside this repo** (a password manager that supports
file attachments, an encrypted USB drive, etc.) and copy the two passwords into a
password manager entry. If this machine is lost and there's no backup, you lose the
ability to publish *updates* to the app under its current identity — Google can
sometimes recover this via a support process if Play App Signing is enabled (step 5),
but it's a slow, painful process you want to avoid needing.

### 5. Build the release bundle
Already done once as a smoke test — `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`
built and signed successfully. To rebuild after any code change:
```bash
pnpm --filter mobile run build
cd apps/mobile
npx cap sync android
cd android
./gradlew.bat bundleRelease
```
The output `.aab` is what you upload to Play Console — never the debug `.apk`.

When Play Console creates the app, it will ask you to opt into **Play App Signing**
(the modern default and effectively required for new apps) — accept it. Google then
re-signs your bundle with its own key for distribution; the keystore from step 4
becomes only your *upload* key, which is what makes losing it recoverable rather than
fatal.

### 6. Fill in the Store listing
Under **Grow → Store presence → Main store listing**:
- **App name**: paste `listing/title.txt`
- **Short description**: paste `listing/short-description.txt`
- **Full description**: paste `listing/full-description.txt`
- **App icon**: upload `graphics/icon-512.png`
- **Feature graphic**: upload `graphics/feature-graphic-1024x500.png`
- **Phone screenshots**: upload all 5 files in `graphics/screenshots/` (Play requires
  at least 2; order them 01→05 as named, which matches Codes → Calendar → Add coupon →
  Coupon detail → Settings, the same order as the GitHub README)
- **Contact email**: `couponkeeper.email@gmail.com` (the address already shown in the
  app's own Settings feedback link, for consistency)
- **Website** (optional but recommended): the GitHub repo URL,
  `https://github.com/dpritula/couponkeeper`

### 7. Set up a release track and testers
1. Go to **Release → Testing → Closed testing**, create a track, and upload the
   `.aab` from step 5.
2. Add at least a few tester email addresses (your own secondary account, a friend,
   etc.).
3. **Google requires new personal developer accounts to run a closed test with at
   least 12 testers opted in, continuously, for 14 days before you're allowed to
   publish to Production.** Plan for this lead time — it applies regardless of how
   ready the app is otherwise.
4. After the 14-day requirement is met and you're satisfied with testing, use
   **Promote release → Production** (or create a new Production release) to go live.

### 8. Before every future release
- Bump `versionCode` (integer, must increase every release) and `versionName` in
  `apps/mobile/android/app/build.gradle`.
- Rebuild with the commands in step 5 and upload the new `.aab`.
- `targetSdkVersion`/`compileSdkVersion` are currently **36** (Android 16), which
  satisfies Play's "target within one year of the latest Android release" policy as of
  today — recheck this if it's been a while since the last release.

## Things intentionally left for you to decide
- **App category**: recommended Business above, but you know your audience best.
- **License** for the GitHub repo is still "Not yet decided" per the README — doesn't
  block Play publishing, unrelated concern.
- **Localized store listings**: everything here is English-only, matching the app's
  current English-only UI (`i18n/locales/en.ts`). Add more languages to both if/when
  the app itself is localized.
