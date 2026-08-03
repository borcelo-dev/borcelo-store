/**
 * Temporary admin script to elevate a user to super_admin.
 *
 * Usage:
 * 1. Log in to the app as an owner
 * 2. Open the browser console (F12 → Console)
 * 3. Paste this entire script and press Enter
 * 4. It will elevate the currently logged-in user to super_admin
 */

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.error("Not signed in. Please log in first.");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    console.error("User document not found in Firestore.");
    return;
  }

  const current = snap.data();
  console.log("Current role:", current.role);

  if (current.role === "super_admin") {
    console.log("Already super_admin. No action needed.");
    return;
  }

  await setDoc(userRef, { role: "super_admin" }, { merge: true });
  console.log("✓ Role elevated to super_admin. Refresh the page.");
});
