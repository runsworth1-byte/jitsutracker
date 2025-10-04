// firebaseConfig.ts (project root)
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyBDDZ5laFavOagHyuRixoMNJGFtPfuT4BE",
  authDomain: "jiujitsu-tracker-67e24.firebaseapp.com",
  projectId: "jiujitsu-tracker-67e24",
  storageBucket: "jiujitsu-tracker-67e24.firebasestorage.app",
  messagingSenderId: "815347690751",
  appId: "1:815347690751:web:9f6e3155cb5af294a330ca",
};

// Ensure the app is initialized exactly once (survives fast refresh/hot reload)
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with RN/web-friendly transport settings.
// If Firestore was already initialized elsewhere, fall back to getFirestore(app).
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      Platform.OS === "web"
        ? { experimentalAutoDetectLongPolling: true }
        : { experimentalForceLongPolling: true }
    );
  } catch (_e) {
    // Already initialized — just return the existing instance
    return getFirestore(app);
  }
})();

export default app;
