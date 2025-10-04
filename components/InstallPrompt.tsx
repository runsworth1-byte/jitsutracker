import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();          // stop auto-mini-infobar
      setDeferred(e);
      setCanPrompt(true);
    };
    // @ts-ignore
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    // Show the prompt; only allowed in a user gesture
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // Optional: analytics on outcome === 'accepted' | 'dismissed'
    setDeferred(null);
    setCanPrompt(false);
  };

  if (!canPrompt) return null;

  return (
    <button
      onClick={onInstall}
      style={{
        position: "fixed", bottom: 16, right: 16,
        padding: "10px 14px", borderRadius: 12, fontWeight: 600,
        boxShadow: "0 6px 20px rgba(0,0,0,.2)", border: "none", cursor: "pointer"
      }}
    >
      Install JitsuTracker
    </button>
  );
}
