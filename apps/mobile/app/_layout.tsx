import "@/lib/i18n";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { Image as ExpoImage } from "expo-image";
import { generatedStores } from "@/features/stores/generatedStores";
import { getPhotoThumbUrl } from "@/features/stores/storeUtils";
import { useImageCachePreference } from "@/features/stores/imageCache";
import { useLanguagePreference } from "@/lib/languagePreference";
import { ThemeProvider, useAppTheme } from "@/theme/useAppTheme";
import { useOnboardingStatus } from "@/features/user/onboarding";

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

  const { hasSeenOnboarding, isLoading } = useOnboardingStatus();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    if (!hasSeenOnboarding && inTabsGroup) {
      router.replace("/onboarding" as any);
    } else if (hasSeenOnboarding && (segments[0] as string) === "onboarding") {
      router.replace("/");
    }
  }, [hasSeenOnboarding, segments, isLoading]);

  useEffect(() => {
    // Optimal strategy: prefetch ONLY the first thumbnail of each store at launch (for the Explore view).
    // The other thumbnails and full-size images are prefetched dynamically when opening a specific store.
    const urlsToPrefetch = generatedStores
      .flatMap((store) => store.photos?.[0])
      .filter((photo) => photo !== undefined)
      .map((photo) => getPhotoThumbUrl(photo))
      .filter((url): url is string => !!url && /^https?:\/\//i.test(url));

    if (urlsToPrefetch.length > 0) {
      // prefetch store cover image thumbnails
      void ExpoImage.prefetch([...new Set(urlsToPrefetch)], "memory-disk").catch(() => false);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="gallery" options={{ presentation: "modal" }} />
        <Stack.Screen name="stats" options={{ presentation: "modal" }} />
        <Stack.Screen name="p2p" options={{ presentation: "modal" }} />
        <Stack.Screen name="contribute" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
    </SafeAreaProvider>
  );
}
