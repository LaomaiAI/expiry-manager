# Expiry Manager - never throw away expired stuff again

One-line pain point: you only notice things when they are already expired, and what you throw away is money; existing apps make you type every item by hand, and you give up after two days.
Live demo: https://laomaiai.github.io/expiry-manager/

## What it does

Expiry Manager is a phone-first app that tracks expiry dates for food, medicine, supplements, daily chemicals, kitchen goods, and baby and pet products, so anything about to expire is visible at a glance. Categories are six groups with 50+ subcategories, each with a reference shelf life that distinguishes unopened from opened.
The one difference: zero manual entry. Photograph the date printed on the package and it is recognized automatically; scan a barcode to look up the product name, then the expiry date is estimated from the category's reference shelf life. When recognition fails, manual entry is always there as a fallback, or tick items off a checklist to add them in bulk.

## Why this exists

Evidence: in August 2026, a Xiaohongshu post for an expiry app got 304 likes and 1338 comments queuing for membership; a 2022 Zhihu question asking how to manage expiry dates still has 111 favorites; four competing apps in this space launched in August 2026 alone. The need is real.
The gap: existing apps all require typing items in one by one, and entry cost is the biggest reason people quit; most are iOS-first with few Android options; and when an old app shuts down, users lose their data with it.
The new approach: scan a barcode or photograph the printed date for automatic entry, installable on Android, and data exportable at any time. No accounts, no cloud, data stays on your phone.

## Four ways to add an item

1. Photograph the expiry date: take a photo of the date printed on the package, on-device OCR reads it and lists candidate dates for you to confirm. Packages that print "production date + shelf life of X months" are handled too: the expiry date is computed for you.
2. Scan a barcode: point the camera at a barcode; food is looked up in the public OpenFoodFacts database, daily chemicals in the sibling OpenBeautyFacts database. When neither finds it, fall back to manual entry with the reference table, never invented data. Medicine and supplements are not scanned, manual entry only. If the live scan fails, upload a photo of the barcode or type the digits by hand.
3. Add from a checklist: four presets (kitchen staples, medicine cabinet, bathroom, baby). Tick the items to add; reference dates are already estimated from today. Items with no reference value need the printed date filled in before everything is added together.
4. Manual entry: name, category, expiry date, purchase date, quantity and notes.

## About the reference shelf life

The reference shelf life table has six groups and 50+ subcategories, e.g. fresh milk 7 days, eggs 30 days, rice 365 days. The values follow common ranges from public food-safety guidance and are only used to estimate a date when no printed date is available. Every subcategory states the unopened and opened difference, e.g. cooking oil 18 months unopened and 3 months after opening, cosmetics 3 years unopened and 6 or 12 months after opening (PAO).
Two rules are stated up front: the date printed on the package always wins; medicine and categories with no generic value have no reference value and must be entered from the printed date. Reference values are not a promise; every category states its basis and conditions.

## Preset checklists

Four presets: kitchen staples (12 items), medicine cabinet (10 items), bathroom (12 items), baby (10 items). Tap "add from a checklist", tick the items to add, and they come with a default category and a reference date estimated from today. Items with no reference value, such as medicine, need the printed date filled in before everything is added together. Checklist dates are estimates; check them against the printed dates after adding.

## Period after opening

Daily chemicals and eye drops start a new countdown on the day they are opened. When an opening date is entered, the expiry date is the opening date plus the PAO months (6 months by default for daily chemicals, changeable; 1 month for eye drops; single-use items such as face masks and soap are excluded), compared with the printed date, and the earlier one wins. The item card says which one decided it. Without an opening date, only the printed date is used.

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
- Three places use the network: barcode lookup uses the public OpenFoodFacts (food) and OpenBeautyFacts (daily chemicals) APIs (no key), and OCR downloads recognition data on first use (about 10 MB, cached by the browser afterwards). All of them are unavailable offline; manual entry always works.
- Tests live in src/lib/*.test.ts (Vitest) and run on every push.

## Not yet verified on a real phone

This version was built on a Linux cloud machine, where npm install, build, tests and web preview were all verified. The OpenBeautyFacts API itself was verified live with curl (it returned one real shampoo product). Four things can only be verified on a real phone and were not tested here: camera barcode scanning, photo OCR accuracy, real-world barcode coverage in both databases, and installing to the Android home screen. Only what was run on this machine is claimed as verified; the rest waits for a real-phone check.

## License

MIT License, see the LICENSE file.
