# Borcello Store — Build Roadmap

**Read this entire document before writing any code.**

---

## 0. Instructions to the build agent (DeepSeek V4 Pro)

You are scaffolding **Borcello Store**, a Sari-Sari Store System, for an academic project (MIT — Mobile & Internet Technologies course). Read this whole file first.

**Ground rules:**

1. **Work in the active/current project directory. Do not create a new subfolder for this app.** Treat the existing repository root as the project root — do not nest the project inside something like `borcello-store/` or `sari-sari-store/`. If a Next.js app already exists at the root, extend it; if not, initialize directly at the root.
2. **Ask clarifying questions before scaffolding anything.** If any part of this roadmap is ambiguous, underspecified, or would require you to guess at an architectural decision (data shape, auth flow, routing, PWA config, file layout) — stop and ask. Do not silently assume and proceed on anything structurally significant. Small naming or micro-styling choices you may decide yourself and just note.
3. **Match scope to the brief.** This is a lean single-shopkeeper tool, not a production platform. Do not add libraries, services, abstractions, or infrastructure beyond what's specified here — no ORM, no monorepo tooling, no multi-tenant auth, no payment integrations. See §9 for an explicit non-goals list; if you're tempted to add something not in this document, ask first instead of adding it.
4. **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Firebase (Firestore, Auth only — no Firebase Storage anywhere in this project, see §4a). No ORM — see §4.
6. **After writing `firestore.rules`, that file must actually be deployed** (`firebase deploy --only firestore:rules`) — writing the file to the repo does nothing on its own. If you can't run the Firebase CLI yourself in this environment, say so explicitly and hand the exact command back to the requester rather than assuming it's been deployed.
5. Once you've read this file and have no open questions, restate your understanding of the plan back to the requester in your own words before starting, so any misreading gets caught early.

---

## 1. Project context

- **Assignment:** Sari-Sari Store System (Data Integrity path) from a Mobile/Internet Technologies course brief. Full requirement list is in §6.
- **Platform decision:** Web (Next.js), installable as a PWA. Chosen over native Android for reach, install-free trial, and fast iteration, with the trade-off that browser-based barcode scanning is less robust than Android's ML Kit — documented, not hidden.
- **Source repo note:** an earlier repo (`suarez-food-hub`) was evaluated and rejected as a starting point — it's a 4-app food delivery monorepo (Prisma/Postgres/Supabase) with no barcode scanning and none of this app's actual scope. Do not port its architecture. The only things worth carrying over conceptually are the low-stock highlight UX pattern and general Tailwind/shadcn setup conventions — everything else here is built fresh.

---

## 2. Information architecture / routes

```
/                       → redirect to /login or /dashboard
/login                  → email/password sign-in
/dashboard              → today's sales, low-stock summary, restock suggestions
/products               → product list, register/edit, Add Stock action
/products/[id]          → product detail + stock log history
/pos                    → virtual cart, barcode scan, checkout
/sales                  → sales history list
/sales/[id]             → single transaction detail (receipt view)
/profile                → account info (reached via top-right dropdown)
/settings               → business config (owner only)
/more                   → secondary menu: categories, reports, restock assistant detail
```

Bottom nav covers: **Dashboard, Products, Sell (POS), History**. Everything else (Profile, Settings, More, Logout) lives behind the top-right avatar dropdown — see §5.

---

## 3. Data model (Firestore)

No relational joins — denormalize what's read together.

### `products`
```
{
  name: string
  barcode: string | null
  categoryName: string
  unitPrice: number
  quantity: number
  bufferQuantity: number      // default 5
  imageUrl: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `categories`
```
{ name: string }
```

### `sales`
```
{
  items: [{ productId, name, qty, unitPrice, lineTotal }]
  total: number
  cashierId: string
  cashierName: string
  createdAt: Timestamp
}
```
Immutable once created — no update/delete from the client (see security rules below).

### `stockLogs`
```
{
  productId: string
  type: 'restock' | 'sale' | 'adjustment'
  delta: number
  resultingQuantity: number
  note: string | null
  actorId: string
  createdAt: Timestamp
}
```
Written alongside every `products.quantity` change. Powers the Smart Restock Assistant (§7.1).

### `users`
```
{ displayName: string, role: 'owner' | 'cashier' }
```
Mirrors the Firebase Auth UID as document ID. **Correction from an earlier draft:** role is *not* set as an Auth custom claim — that requires the Admin SDK (Cloud Functions or a privileged server route), which this project deliberately avoids. Instead, security rules read the `users` document directly (see below). If you find `request.auth.token.role` anywhere in the codebase, that's leftover from the earlier draft and needs to be replaced with the `get()`-based check below.

### `pendingSales`
```
{
  cart: [{ productId, name, qty, unitPrice, lineTotal }]
  cashierId: string
  cashierName: string
  status: 'pending' | 'committed' | 'conflict'
  conflictReason: string | null
  createdAt: Timestamp
}
```
Staging collection for offline-safe checkout — see §7.2 for why this exists and how it's processed. Document ID is the client-generated sale ID (see §7.2), making every write to this collection idempotent by construction.

### `firestore.rules` (real version — this must actually be deployed, not just written to the repo)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }
    function getRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    match /products/{id} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    match /categories/{id} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    match /sales/{id} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if false;
    }
    match /stockLogs/{id} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if false;
    }
    match /pendingSales/{id} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if false;
    }
    match /users/{id} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getRole() == 'owner';
    }
  }
}
```

---

## 4. Data access layer — no ORM

Firestore is schemaless NoSQL; there's no client to generate from it, which is the entire premise of an ORM. Do not add Fireorm, firestore-simple, or any similar wrapper — they add indirection that fights Firestore's real-time listener model for no real benefit at this scale.

**Pattern:** one file per collection under `lib/data-access/`, each exporting a small set of typed functions. Validate writes with Zod schemas in `lib/schemas/`.

```ts
// lib/schemas/product.ts
import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1),
  barcode: z.string().optional(),
  categoryName: z.string(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().nonnegative(),
  bufferQuantity: z.number().int().nonnegative().default(5),
  imageUrl: z.string().url().optional(),
});
export type Product = z.infer<typeof ProductSchema> & { id: string };
```

```ts
// lib/data-access/products.ts
export async function addStock(productId: string, delta: number, actorId: string) {
  const ref = doc(db, "products", productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.data()!.quantity as number;
    tx.update(ref, { quantity: current + delta, updatedAt: serverTimestamp() });
    tx.set(doc(collection(db, "stockLogs")), {
      productId, type: "restock", delta, resultingQuantity: current + delta,
      actorId, createdAt: serverTimestamp(),
    });
  });
}

// checkout no longer runs a transaction directly — see §7.2 for why,
// and for the full recordSale + processPendingSales design.
```

The `runTransaction` inside `processPendingSales` (§7.2) is what delivers the stock-validation guarantee from the brief (no overselling under concurrent checkouts) — this is the load-bearing logic, not a wrapper library.

---

## 4a. Image uploads — Cloudinary, not Firebase Storage

Firebase Storage now requires the Blaze billing plan even for near-zero usage (effective Feb 3, 2026) — this project avoids it entirely. Product photos go to Cloudinary's free tier (no card required) instead.

```ts
// lib/cloudinary/upload.ts
export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url as string; // store this in products.imageUrl
}
```

`lib/firebase/config.ts` should not import `firebase/storage` or export a `storage` instance at all — if it currently does, remove it; nothing in this app should ever touch Firebase Storage.

## 5. Design system — "Violet Counter"

Off-white base, one confident purple, sharp corners, sized up for readability. Apply via CSS variables + Tailwind theme extension — one fixed theme, no dark mode, no multi-brand system.

### Color tokens
```css
--bg:            #F7F6FB;  /* app shell */
--surface:       #FFFFFF;  /* cards, sheets */
--surface-muted: #EFEBFA;  /* table headers, selected states */
--border:        #DDD6EF;  /* hairlines */
--ink:           #221934;  /* primary text — ~15:1 on --bg */
--ink-muted:     #55506A;  /* secondary text — ~5:1 on white, passes AA */
--purple:        #5B34A6;  /* primary — buttons, links, active nav (~7.8:1 both directions) */
--purple-pressed:#47277F;  /* hover/active state */
--purple-tint:   #EDE6FB;  /* badges, active nav pill bg */
--success:       #1E7A46;  /* in-stock / confirmations */
--danger:        #B3261E;  /* low-stock, destructive actions, logout */
```

### Typography
- **Headings:** Manrope, 700/800 weight.
- **Body / UI text:** Source Sans 3, 400/600 weight. Base body size **17px** (deliberately above the usual 16px default — this app is for an older/middle-aged audience).
- **Numeric data** (prices, quantities, SKUs, receipts): IBM Plex Mono, tabular figures, so price columns align.
- Type scale: 13 / 14 / 17 / 20 / 24 / 28 / 32 (px). Nav labels never below 14px.

### Shape & spacing
- **Corner radius: 2px, everywhere** — buttons, cards, inputs, modals, dropdown panel, nav pill highlight. **One documented exception:** the profile avatar stays circular (portrait container, not a "corner").
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 (px), 4px base grid.
- Shadows: minimal. One elevation token for the bottom nav and dropdown panel: `0 2px 8px rgba(34,25,52,0.12)`, plus a 1px `--border` hairline on the bottom nav to separate it from content. No heavy shadows or gradients elsewhere.
- Touch targets: minimum 48px; bottom nav items 64px including label — deliberately generous for the target age range.
- Focus ring: `2px solid var(--purple)`, 2px offset. Always visible on keyboard focus.

### Navigation shell
**Responsive split — same 4 destinations, two presentations:**
- **Mobile (< 768px): bottom nav.** Fixed, `env(safe-area-inset-bottom)` padding for PWA/notch devices. 4 destinations only: **Dashboard, Products, Sell, History**. Icon + label always paired, never icon-only.
- **Desktop (≥ 768px): fixed left sidebar**, same 4 destinations, same active-state treatment, replacing the bottom nav (hidden at this breakpoint — never render both at once). Sits below the top bar, full height, `--surface` background with a `--border` right-hand hairline. **The top bar stays visible at all breakpoints** — the sidebar only replaces the bottom nav, not the top bar.
- Active state (either layout): `--purple` icon/text + `--purple-tint` pill background behind the icon.
- Icons: simple 24px line icons (lucide-react is fine).
- Implementation note: this should be a CSS-breakpoint show/hide (Tailwind `hidden md:flex` / `md:hidden`), both reading the same `navItems` array — not two components maintaining separate state.

**Top bar (all breakpoints):**
- Left: the Borcello Store logo lockup image (`/lockup-on-light.png` — a real provided asset, not text to redraw).
- Right: circular avatar button → dropdown panel (2px radius, elevation token above), containing in order: **Profile → Settings → divider → More → divider → Logout**. Logout styled in `--danger`.

### Explicit non-goals for this design system
- No dark mode toggle.
- No animation-heavy transitions — simple opacity/transform fades only where they clarify state change (e.g. dropdown open/close), nothing decorative.
- No icon-only controls anywhere in primary navigation.

---

## 6. Requirement checklist (from the assignment brief)

- [ ] Product registration (name, category, price)
- [ ] Add Stock workflow (increment counts)
- [ ] Barcode integration, auto-fetch stock level on scan
- [ ] Image attachment via camera/gallery
- [ ] Virtual cart (multiple items, pending sale)
- [ ] Stock validation before checkout (block if `requestedQty > quantity`)
- [ ] Transaction execution (deduct stock + log sale, atomic)
- [ ] Real-time UI update (Firestore listeners)
- [ ] Sales History (list, total, timestamp)
- [ ] Low Stock Alerts (`quantity ≤ bufferQuantity`)

---

## 7. Value-added features — implementation detail

### 7.1 Smart Restock Assistant
*(Intelligence + administrative efficiency)*

Instead of a flat quantity threshold, compute a rolling average daily sales velocity per product from `stockLogs` entries of `type: 'sale'`, and project days-until-stockout:

```
daysOfStockLeft = quantity / max(avgDailySalesQty, 0.1)
```

Surface a ranked list on `/dashboard` — e.g. "Product X: ~2 days of stock left" — sorted by urgency, instead of a binary red/not-red flag. This can run as a client-side computation on read (simplest, sufficient for this scale) or, if you prefer, a scheduled Cloud Function that pre-computes it — client-side is the recommended default; only reach for a Cloud Function if read volume becomes a real concern, which it won't at this project's scale.

### 7.2 Offline-Ready POS
*(UX + real-world resilience)*

**Revised design — read this even if an earlier version exists in the codebase.** The original plan assumed `recordSale` could just run inside a Firestore transaction while offline. That doesn't work: transactions require a live round-trip to the server to read fresh data before committing, so they cannot be queued offline the way plain writes can — as built, checkout would simply fail while offline, defeating the point.

**The fix keeps the hard stock-validation guarantee (no overselling, ever) while still working offline, using an outbox pattern — no new services, just one extra Firestore collection plus the existing transaction logic:**

1. **Checkout writes to `pendingSales`, not directly to `sales`.** Generate the sale ID client-side (`crypto.randomUUID()`) and write a single document to `pendingSales/{saleId}` via plain `setDoc` — a normal single-document write, which *does* queue correctly offline (unlike a transaction). This is what makes checkout feel instant, online or off. Cart-side stock validation at this point uses the last-known cached quantity — a heuristic UX check to block obviously-wrong input, not the authoritative guarantee.

2. **A sync processor commits pending sales for real, and only runs when actually online.** Triggered on app load, on the browser `online` event, and (as a safety net) every ~30s while online. For each `pendingSales` doc with `status: 'pending'`, ordered by `createdAt`:
   - Run the **real `runTransaction`**: re-read the pending sale doc and abort if its status isn't still `'pending'` (this is what makes reprocessing idempotent — a sale can never be committed twice, even if the processor runs concurrently in two tabs or gets retried). Re-read each product's live quantity, validate stock, decrement, write the real `sales/{saleId}` doc (same ID as the pending doc) and its `stockLogs` entries, and set `pendingSales/{saleId}.status = 'committed'`.
   - If stock validation fails inside that transaction (someone else genuinely sold the last unit in the meantime), catch that specific error and set `status: 'conflict'` with a human-readable `conflictReason` instead of silently dropping the sale. This is the bounded, rare failure mode — surfaced for a human to resolve, never silently corrupting stock.
3. **Sync indicator states**, shown near `/pos` and as a small badge elsewhere: `Synced` (no pending docs) → `Saving offline — N pending` (offline, count of `status: 'pending'`) → `Syncing…` (online, processor actively running) → `⚠ N sales need review` (any `status: 'conflict'` exist — links to a simple list under `/more` showing the cart contents and reason, so the owner can manually adjust stock or note it and move on; this can be a plain list view, not a workflow).

**Why this isn't overengineering:** it's one extra collection and the same transaction logic already being written for §6's requirements — not a message queue, not a background job service, not a new dependency. The only genuinely new concept is "stage first, commit for real once online," which is the minimum needed to get *both* offline capability and a hard no-oversell guarantee — you cannot get both from a transaction alone, since transactions can't run offline at all.

---

## 8. PWA requirements

- `public/manifest.json`: `name: "Borcello Store"`, `short_name: "Borcello"`, `theme_color: "#5B34A6"`, `background_color: "#F7F6FB"`, `display: "standalone"`, icons at 192×192 and 512×512 (plus a maskable variant — see the logo prompt for safe-zone padding).
- `public/sw.js`: basic app-shell caching for offline load; data offline behavior is handled by Firestore persistence (§7.2), not the service worker.
- Custom "Add to Home Screen" prompt: don't rely solely on the native browser install prompt — add a simple, dismissible in-app banner, since the target audience may not discover it otherwise.

---

## 9. Explicit non-goals / scope cuts

Do not build any of the following — they belong to the source repo's much larger scope, not this project:

- Multiple apps, multi-tenant business config, or a monorepo/Turborepo setup
- Customer-facing ordering, delivery riders, or live GPS tracking
- Payment gateway integrations (GCash, Maya, or otherwise)
- Rider commissions, cashouts, or earnings tracking
- A multi-state order fulfillment pipeline — a sale here is a single atomic transaction
- More than two user roles (Owner, Cashier)
- Any ORM (§4)
- Dark mode or multi-theme support (§5)
- Firebase Storage, in any form (§4a — Cloudinary only)
- A real message queue, job scheduler, or background service for `pendingSales` (§7.2) — it's a plain Firestore collection processed by client-side logic, nothing more
- Auth custom claims or Cloud Functions for role checks (§3 — Firestore-document read instead)

If a task seems to call for any of the above, stop and ask rather than building it.

---

## 10. Acceptance checklist

- [ ] All ten items in §6 implemented and demoable
- [ ] Both value-added features (§7) implemented and demoable, including the `pendingSales` → commit flow in §7.2 tested with devtools offline mode
- [ ] No sale ever becomes authoritative (written to `sales`, decrementing `products.quantity`) without passing through the real `runTransaction` check — verify by reading `sales.ts`, not just by testing the happy path
- [ ] Design system (§5) applied consistently — 2px radius, correct palette, sidebar (desktop) + bottom nav (mobile) + profile dropdown, logo lockup in the top bar (not placeholder text)
- [ ] Product images upload to Cloudinary; `firebase/storage` does not appear anywhere in the codebase
- [ ] PWA installable, passes a basic Lighthouse PWA check
- [ ] `firestore.rules` matches §3 **and has actually been deployed** (`firebase deploy --only firestore:rules`) — confirm by checking the Rules tab in the Firebase console shows the real rules, not the default-deny placeholder
- [ ] No dependencies or infrastructure outside what's listed in this document
