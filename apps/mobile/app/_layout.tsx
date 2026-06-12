import "@/lib/i18n";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { Image as ExpoImage } from "expo-image";
import { generatedStores } from "@/features/stores/generatedStores";
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

  useEffect(() => {
    const urlsToPrefetch = generatedStores
      .flatMap((store) => store.photos?.[0])
      .filter((photo) => photo !== undefined)
      .map((photo) => photo.thumbUrl ?? photo.url);

    if (urlsToPrefetch.length > 0) {
      ExpoImage.prefetch(urlsToPrefetch);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={theme.isDark ? "light" : "dark"} />
    </SafeAreaProvider>
  );
}
