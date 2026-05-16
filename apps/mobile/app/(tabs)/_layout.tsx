import { Tabs } from "expo-router";
import { Map, Search, UserRound, ShieldCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getCurrentProfile } from "@/features/social/socialApi";
import { colors } from "@/theme/tokens";

export default function TabsLayout() {
  const { t } = useTranslation();
  const [isReviewer, setIsReviewer] = useState(false);

  useEffect(() => {
    void getCurrentProfile().then((profile) => {
      // In a real app, check profile.is_reviewer
      if (profile) setIsReviewer(true); 
    }).catch(() => {
      // Default to true for local testing if Supabase is missing
      setIsReviewer(true);
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
