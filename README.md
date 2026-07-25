# Borcello Store

Sari-Sari Store System — an installable PWA for point-of-sale and inventory management.

**Built with:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Firebase (Firestore, Auth, Storage)

---

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.local.example` to `.env.local` and fill in your Firebase project values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

3. Deploy the Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Build

```bash
npm run build
npm start
```

---

## Deploy on Vercel

Set the environment variables listed above in your Vercel project settings. The app is configured for Vercel via `vercel.json` — no additional setup needed.

---

## Routes

| Route | Description |
|---|---|
| `/login` | Email/password sign-in |
| `/dashboard` | Today's sales, low-stock alerts, restock assistant |
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

- **Framework:** Next.js 16 (App Router, RSC)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 — "Violet Counter" design system
- **Database:** Firebase Firestore (real-time listeners, atomic transactions)
- **Auth:** Firebase Auth (email/password)
- **Storage:** Firebase Storage (product images)
- **Barcode:** html5-qrcode (QR + Code128 + EAN)
- **Validation:** Zod
- **Icons:** Lucide React
- **Fonts:** Manrope, Source Sans 3, IBM Plex Mono

## Design System — Violet Counter

| Token | Value |
|---|---|
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

## PWA

Installable on desktop and mobile. Includes:

- `manifest.json` with correct theme color, display mode, and icons
- Service worker (`sw.js`) for app-shell caching
- Firestore offline persistence (IndexedDB) for the POS page
- Custom "Add to Home Screen" banner
- Sync-status indicator for offline sales

---

## License

MIT
