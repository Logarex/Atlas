import "@/lib/i18n";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useImageCachePreference } from "@/features/stores/imageCache";
import { useLanguagePreference } from "@/lib/languagePreference";
import { ThemeProvider, useAppTheme } from "@/theme/useAppTheme";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
}

function InnerLayout() {
  const theme = useAppTheme();
  useImageCachePreference();
  useLanguagePreference();

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={theme.isDark ? "light" : "dark"} />
    </SafeAreaProvider>
  );
}
