import { Tabs } from "expo-router";
import { Home, Map, Search, UserRound } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "@/theme/useAppTheme";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

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
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />
        }}
      />

    </Tabs>
  );
}
