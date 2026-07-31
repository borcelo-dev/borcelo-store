/**
 * One-off seed script for Borcello Store demo data.
 *
 * Usage:
 *   OWNER_EMAIL=you@example.com OWNER_PASSWORD=secret npx tsx scripts/seed.ts
 *
 * Reads Firebase config from .env.local (NEXT_PUBLIC_FIREBASE_*)
 * and owner credentials from OWNER_EMAIL / OWNER_PASSWORD.
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  writeBatch,
  doc,
  collection,
  Timestamp,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env.local") });

// ── env ────────────────────────────────────────────────────────────────
const OWNER_EMAIL = process.env.OWNER_EMAIL;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD;

if (!OWNER_EMAIL || !OWNER_PASSWORD) {
  console.error("Error: OWNER_EMAIL and OWNER_PASSWORD env vars are required.");
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ── init ───────────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ── helpers ────────────────────────────────────────────────────────────
function daysAgo(n: number): Timestamp {
  const d = new Date();
  d.setHours(10, 0, 0, 0); // 10 AM each day for consistency
  d.setDate(d.getDate() - n);
  return Timestamp.fromDate(d);
}

// ── seed data ──────────────────────────────────────────────────────────
const CATEGORIES = ["Beverages", "Snacks", "Personal Care", "Instant Noodles"];

const PRODUCTS = [
  { name: "Coca-Cola 1.5L",            categoryName: "Beverages",      unitPrice: 85, quantity: 40, bufferQuantity: 10, barcode: "4800016641234", imageUrl: null },
  { name: "Lucky Me Pancit Canton",    categoryName: "Instant Noodles", unitPrice: 15, quantity: 8,  bufferQuantity: 10, barcode: null,           imageUrl: null },
  { name: "Safeguard Soap 90g",        categoryName: "Personal Care",   unitPrice: 35, quantity: 0,  bufferQuantity: 5,  barcode: null,           imageUrl: null },
  { name: "Chippy 110g",               categoryName: "Snacks",          unitPrice: 25, quantity: 25, bufferQuantity: 5,  barcode: "4800735040015", imageUrl: null },
  { name: "Bear Brand Milk",           categoryName: "Beverages",       unitPrice: 18, quantity: 15, bufferQuantity: 5,  barcode: null,           imageUrl: null },
  { name: "Nescafe 3-in-1",            categoryName: "Beverages",       unitPrice: 8,  quantity: 60, bufferQuantity: 20, barcode: null,           imageUrl: null },
  { name: "Piattos 85g",               categoryName: "Snacks",          unitPrice: 30, quantity: 12, bufferQuantity: 5,  barcode: null,           imageUrl: null },
  { name: "Palmolive Shampoo sachet",  categoryName: "Personal Care",   unitPrice: 6,  quantity: 3,  bufferQuantity: 5,  barcode: null,           imageUrl: null },
];

// Historical sales config: product name → units sold per day
const HISTORICAL_SALES: Record<string, { dailyQty: number }> = {
  "Lucky Me Pancit Canton":   { dailyQty: 2 },
  "Chippy 110g":              { dailyQty: 3 },
  "Palmolive Shampoo sachet": { dailyQty: 1 },
};

const SALE_DAYS = 6; // last 6 days

// ── main ───────────────────────────────────────────────────────────────
async function main() {
  // 1. Sign in
  console.log("Signing in as", OWNER_EMAIL, "...");
  const cred = await signInWithEmailAndPassword(auth, OWNER_EMAIL!, OWNER_PASSWORD!);
  const uid = cred.user.uid;
  const cashierName = cred.user.displayName || "Owner";
  console.log("Signed in:", uid);

  const batch = writeBatch(db);
  let categoryCount = 0;
  let productCount = 0;
  let saleCount = 0;
  let stockLogCount = 0;

  // 2. Categories
  for (const name of CATEGORIES) {
    const ref = doc(collection(db, "categories"));
    batch.set(ref, { name });
    categoryCount++;
  }

  // 3. Products — write with a placeholder quantity; we'll overwrite
  //    the 3 products that have historical sales after computing the
  //    correct starting quantity.
  const productIds: Record<string, string> = {};

  for (const p of PRODUCTS) {
    const ref = doc(collection(db, "products"));
    productIds[p.name] = ref.id;

    const now = Timestamp.now();
    batch.set(ref, {
      name: p.name,
      barcode: p.barcode,
      categoryName: p.categoryName,
      unitPrice: p.unitPrice,
      quantity: p.quantity, // final qty after historical sales
      bufferQuantity: p.bufferQuantity,
      imageUrl: p.imageUrl,
      createdAt: now,
      updatedAt: now,
    });
    productCount++;
  }

  // 4. Historical sales + stockLogs
  //    For each product with historical sales, work backwards:
  //    startingQty = currentQty + (dailyQty * SALE_DAYS)
  //    Then for each day, decrement by dailyQty.
  for (const [productName, cfg] of Object.entries(HISTORICAL_SALES)) {
    const pid = productIds[productName];
    const product = PRODUCTS.find((p) => p.name === productName)!;
    const startingQty = product.quantity + cfg.dailyQty * SALE_DAYS;

    for (let day = SALE_DAYS; day >= 1; day--) {
      const ts = daysAgo(day);
      const daysFromStart = SALE_DAYS - day + 1;
      const resultingQty = startingQty - cfg.dailyQty * daysFromStart;

      // Sales document
      const saleRef = doc(collection(db, "sales"));
      const lineTotal = product.unitPrice * cfg.dailyQty;
      batch.set(saleRef, {
        items: [
          {
            productId: pid,
            name: product.name,
            qty: cfg.dailyQty,
            unitPrice: product.unitPrice,
            lineTotal,
          },
        ],
        total: lineTotal,
        cashierId: uid,
        cashierName,
        createdAt: ts,
      });
      saleCount++;

      // Stock log
      const logRef = doc(collection(db, "stockLogs"));
      batch.set(logRef, {
        productId: pid,
        type: "sale",
        delta: -cfg.dailyQty,
        resultingQuantity: resultingQty,
        note: null,
        actorId: uid,
        createdAt: ts,
      });
      stockLogCount++;
    }
  }

  // 5. Commit
  await batch.commit();

  console.log("\n✓ Seed complete:");
  console.log(`  ${categoryCount} categories`);
  console.log(`  ${productCount} products`);
  console.log(`  ${saleCount} historical sales`);
  console.log(`  ${stockLogCount} stock log entries`);
  console.log(`\nProducts with historical sales (for Smart Restock Assistant):`);
  for (const [name, cfg] of Object.entries(HISTORICAL_SALES)) {
    const p = PRODUCTS.find((pp) => pp.name === name)!;
    console.log(`  ${name}: ~${cfg.dailyQty}/day × ${SALE_DAYS} days → now ${p.quantity} in stock`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
