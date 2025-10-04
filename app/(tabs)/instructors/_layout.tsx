import { Stack } from "expo-router";
import Head from "expo-router/head";
import { useEffect } from "react";

export default function InstructorsStackLayout() {
  // Ensure SW is registered (safe no-op on native)
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return (
    <>
      <Head>
        {/* Manifest + PWA meta */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Optional: keeps iOS friendly */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </Head>

      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
