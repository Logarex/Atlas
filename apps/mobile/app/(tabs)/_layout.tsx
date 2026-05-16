import { Tabs } from "expo-router";
import { Map, Search, UserRound, ShieldCheck, Home } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getCurrentProfile } from "@/features/social/socialApi";
import { useAppTheme } from "@/theme/useAppTheme";

export default function TabsLayout() {
  const { t } = useTranslation();
  const [isReviewer, setIsReviewer] = useState(false);
  const { colors } = useAppTheme();

  useEffect(() => {
    console.log("Checking reviewer status...");
    getCurrentProfile()
      .then((profile) => {
        console.log("Profile loaded:", profile?.username);
        // Only enable if user explicitly has the reviewer flag in DB
        setIsReviewer(profile?.isReviewer ?? false); 
      })
      .catch((err) => {
        console.log("Profile fetch failed:", err.message);
        setIsReviewer(false);
      });
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t("tabs.explore"),
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t("tabs.map"),
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: t("tabs.review"),
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
          href: isReviewer ? "review" : null
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />
        }}
      />
    </Tabs>
  );
}
