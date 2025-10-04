import { Redirect, useRootNavigationState } from "expo-router";

export default function Index() {
  const nav = useRootNavigationState();
  if (!nav?.key) return null;
  return <Redirect href="/(tabs)/techniques" />;
}
