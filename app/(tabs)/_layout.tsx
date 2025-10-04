import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import Head from "expo-router/head";
import { useEffect } from "react";

export default function TabsLayout() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </Head>

      <Tabs
        initialRouteName="techniques"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#0081c3",
          tabBarInactiveTintColor: "#666",
          tabBarStyle: {
            backgroundColor: "#e6f2f9",
            borderTopColor: "#d5e6f0",
            height: 56,
            paddingTop: 4,
          },
          tabBarIcon: ({ color, size, focused }) => {
            let icon: keyof typeof Ionicons.glyphMap = "apps-outline";
            switch (route.name) {
              case "techniques":  icon = focused ? "list" : "list-outline"; break;
              case "instructors": icon = focused ? "people" : "people-outline"; break;
              case "study":       icon = focused ? "book" : "book-outline"; break;
              case "drills":      icon = focused ? "layers" : "layers-outline"; break;
              case "add":         icon = focused ? "add-circle" : "add-circle-outline"; break;
              case "curricula":   icon = focused ? "school" : "school-outline"; break;
              case "sequences":   icon = "git-branch"; break; // folder name, not file
              default:            icon = focused ? "apps" : "apps-outline";
            }
            return <Ionicons name={icon} size={size} color={color} />;
          },
        })}
      >
        <Tabs.Screen name="techniques"  options={{ title: "Techniques" }} />
        <Tabs.Screen name="instructors" options={{ title: "Instructors" }} />
        <Tabs.Screen name="study"       options={{ title: "Study" }} />
        <Tabs.Screen name="drills"      options={{ title: "Drills" }} />
        <Tabs.Screen name="add"         options={{ title: "Add" }} />
        <Tabs.Screen name="curricula"   options={{ title: "Curricula" }} />
        {/* Force the Sequences tab link to the folder index */}
        <Tabs.Screen
          name="sequences"
          options={{ title: "Sequences", href: { pathname: "/sequences" } }}
        />
      </Tabs>
    </>
  );
}
