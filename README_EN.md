# Expiry Manager - never throw away expired stuff again

One-line pain point: you only notice things when they are already expired, and what you throw away is money; existing apps make you type every item by hand, and you give up after two days.
Live demo: to be added after the GitHub Pages deploy.

## What it does

Expiry Manager is a phone-first app that tracks expiry dates for food, household goods, cosmetics and medicine, so anything about to expire is visible at a glance.
The one difference: zero manual entry. Photograph the date printed on the package and it is recognized automatically; scan a barcode to look up the product name, then the expiry date is estimated from the category's reference shelf life. When recognition fails, manual entry is always there as a fallback.

## Why this exists

Evidence: in August 2026, a Xiaohongshu post for an expiry app got 304 likes and 1338 comments queuing for membership; a 2022 Zhihu question asking how to manage expiry dates still has 111 favorites; four competing apps in this space launched in August 2026 alone. The need is real.
The gap: existing apps all require typing items in one by one, and entry cost is the biggest reason people quit; most are iOS-first with few Android options; and when an old app shuts down, users lose their data with it.
The new approach: scan a barcode or photograph the printed date for automatic entry, installable on Android, and data exportable at any time. No accounts, no cloud, data stays on your phone.

## Three ways to add an item

1. Photograph the expiry date: take a photo of the date printed on the package, on-device OCR reads it and lists candidate dates for you to confirm. Packages that print "production date + shelf life of X months" are handled too: the expiry date is computed for you.
2. Scan a barcode: point the camera at a barcode to look up the product name in the public OpenFoodFacts database, then estimate the expiry date from the category's reference shelf life. If the live scan fails, upload a photo of the barcode or type the digits by hand.
3. Manual entry: name, category, expiry date, purchase date, quantity and notes.

## About the reference shelf life

Every category has a reference shelf life, e.g. fresh milk 7 days, eggs 30 days, rice 365 days. The values follow common ranges from public food-safety guidance and are only used to estimate a date when no printed date is available.
Two rules are stated up front: the date printed on the package always wins; medicine and categories with no generic value have no reference value and must be entered from the printed date. Reference values are not a promise; every category states its basis and conditions.

## Install and use

This is a PWA (progressive web app): no app store download, no account.
1. Open the live demo URL in your Android phone browser.
2. Use the browser menu "Add to Home screen"; after that it opens like an app.
3. Tap "add item" and photograph, scan or type. Data is stored in the phone browser.

Local development:
```bash
npm install
npm run dev
npm test
npm run build
```

## Why a PWA first, not a mini-program

A WeChat mini-program needs a personal WeChat account certification, 30 yuan per certification, and the account would be logged in on a developer server. A PWA needs no account, no fee and no store review, and it already covers everything v1 needs. So v1 is a PWA; a mini-program can come later.

## Data and privacy

All data lives only in your phone browser's localStorage. Nothing is uploaded, no registration, no login, no analytics. Export CSV or JSON at any time, and import back from a JSON file. Clearing browser data also clears your items, so export a backup before clearing.

## Deterministic by design

This app is 100% code, no large language model anywhere.
- Date recognition, urgency buckets, shelf-life math and CSV export are all local code rules: same input, same output.
- Two places use the network: barcode lookup uses the public OpenFoodFacts API (no key), and OCR downloads recognition data on first use (about 10 MB, cached by the browser afterwards). Both are unavailable offline; manual entry always works.
- Tests live in src/lib/*.test.ts (Vitest) and run on every push.

## Not yet verified on a real phone

This version was built on a Linux cloud machine, where npm install, build, tests and web preview were all verified. Three things can only be verified on a real phone and were not tested here: camera barcode scanning, photo OCR accuracy, and installing to the Android home screen. Only what was run on this machine is claimed as verified; the rest waits for a real-phone check.

## License

MIT License, see the LICENSE file.
