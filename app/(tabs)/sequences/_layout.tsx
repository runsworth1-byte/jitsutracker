import { Stack } from "expo-router";

export default function SequencesStack() {
  // Let Expo Router auto-register index.tsx, new.tsx, [id].tsx
  return <Stack screenOptions={{ headerShown: false }} />;
}
