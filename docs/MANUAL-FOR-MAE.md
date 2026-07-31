# Borcello Store — Manual for Mae

## Quick Summary

**Status:** All 10 core features + 2 value-add features are **DONE**. The app is fully functional.

**What remains:** Polish items (optional), manual testing, and submission materials (video, docs, README).

---

## What's Built (Complete)

| Feature | Status | Where It Lives |
|---------|--------|----------------|
| Product registration (name, category, price) | ✅ Done | `product-form.tsx`, `/products` |
| Add Stock workflow | ✅ Done | `products.ts` + `stockLogs` writes |
| Barcode integration (scan-to-sell) | ✅ Done | `html5-qrcode` in `pos/page.tsx` |
| Image attachment (camera/gallery) | ✅ Done | Cloudinary in `product-form.tsx` |
| Virtual cart | ✅ Done | `pos/page.tsx` |
| Stock validation before checkout | ✅ Done | `pos/page.tsx` + `commitSale()` |
| Atomic transaction execution | ✅ Done | `commitSale()` in `sales.ts` |
| Real-time UI updates | ✅ Done | `onSnapshot` listeners |
| Sales History | ✅ Done | `/sales`, `/sales/[id]` |
| Low Stock Alerts | ✅ Done | `dashboard/page.tsx` |
| Smart Restock Assistant (value-add) | ✅ Done | `dashboard/page.tsx` |
| Offline-Ready POS (value-add) | ✅ Done | `pendingSales.ts`, `sync-context.tsx`, `sync-indicator.tsx` |

---

## What's Left To Do

### 1. Manual Testing (Before Recording Demo)

Run through these tests to confirm everything works:

- [ ] **Settings page loads** for the owner account (confirms Firestore rules are deployed)
- [ ] **Add a product with a photo** (confirms Cloudinary upload works end-to-end)
- [ ] **Scan a barcode at checkout** (confirms it auto-fills the product)
- [ ] **Offline sale test:**
  1. DevTools → Network → set to Offline
  2. Complete a sale
  3. Confirm "Saving offline — N pending" shows
  4. Go back online
  5. Confirm it flips to "Syncing..." then clears
  6. Check the sale appears in Sales History
- [ ] **Responsive test:** Resize to desktop width — sidebar should appear, bottom nav should disappear, top bar stays
- [ ] **Oversell test:** Try to add more items than available stock — confirm the stock-validation error fires

### 2. Optional Polish (Not Blocking)

These are minor improvements, not required for submission:

- [ ] Delete duplicate icon/lockup PNGs at repo root (only `public/` copies are used)
- [ ] Copy `lockup-on-purple.png` into `public/` if needed for dark backgrounds
- [ ] Swap top bar's `<img>` for Next's `<Image>` component (minor perf improvement)

### 3. Submission Materials

- [ ] **Record the demo video:** Register product → scan-to-sell → low-stock alert → sales history → show one value-add feature live
- [ ] **Write description & justification document:** App/platform choice, Firebase architecture, the two value-added features, offline outbox redesign
- [ ] **Final README pass:** Ensure a grader can set it up from scratch

---

## How to Run the App

### Prerequisites
- Node.js 18+
- npm or pnpm
- Firebase project (already configured in `.env.local`)

### Setup
```bash
# Install dependencies
npm install

# Deploy Firestore security rules (if not already deployed)
firebase deploy --only firestore:rules

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm start
```

---

## App Routes

| Route | What It Does |
|-------|--------------|
| `/login` | Email/password sign-in |
| `/dashboard` | Today's stats, low-stock alerts, restock assistant |
| `/products` | Product list, register, search, category filter |
| `/products/[id]` | Product detail + stock log history + add stock |
| `/pos` | Point of sale — virtual cart, barcode scan, checkout |
| `/sales` | Sales history list |
| `/sales/[id]` | Single transaction receipt view |
| `/profile` | Account info |
| `/settings` | Business config (owner only) |
| `/more` | Categories, reports, restock forecast |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 — "Violet Counter" design system
- **Database:** Firebase Firestore (real-time listeners, atomic transactions)
- **Auth:** Firebase Auth (email/password)
- **Image Upload:** Cloudinary (not Firebase Storage)
- **Barcode:** html5-qrcode
- **Validation:** Zod
- **Icons:** Lucide React

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/(app)/pos/page.tsx` | POS page with cart and barcode scanning |
| `src/app/(app)/dashboard/page.tsx` | Dashboard with low-stock alerts and restock assistant |
| `src/app/(app)/products/page.tsx` | Product list and registration |
| `src/app/(app)/sales/page.tsx` | Sales history |
| `src/lib/data-access/sales.ts` | `commitSale()` — atomic transaction |
| `src/lib/data-access/pendingSales.ts` | Offline outbox pattern |
| `src/lib/data-access/products.ts` | Product CRUD + `addStock()` |
| `src/contexts/sync-context.tsx` | Offline sync state management |
| `src/components/ui/sync-indicator.tsx` | 4-state sync status banner |
| `src/components/product-form.tsx` | Product create/edit form with image upload |
| `firestore.rules` | Security rules (get()-based role check) |

---

## Design System — Violet Counter

| Token | Value |
|-------|-------|
| Background | `#F7F6FB` |
| Surface | `#FFFFFF` |
| Primary | `#5B34A6` |
| Danger | `#B3261E` |
| Success | `#1E7A46` |
| Border radius | 2px everywhere |
| Base font size | 17px |
| Heading font | Manrope 700/800 |
| Body font | Source Sans 3 400/600 |
| Numeric font | IBM Plex Mono (tabular figures) |

---

## Environment Variables

Already configured in `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

---

## Troubleshooting

**Settings page shows "owner only":**
- Firestore rules haven't been deployed. Run `firebase deploy --only firestore:rules`

**Image upload fails:**
- Check Cloudinary env vars are set correctly
- Ensure the upload preset is set to "Unsigned" in Cloudinary dashboard

**Barcode scanning doesn't work:**
- Must be on HTTPS or localhost (camera access requirement)
- Check browser permissions for camera access

**Offline sales not syncing:**
- Check the sync indicator in the bottom-right corner
- Go to `/more` to review any conflicts

---

## Questions?

If anything is unclear or you need help with a specific feature, just ask!