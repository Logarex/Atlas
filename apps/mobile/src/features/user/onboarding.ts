import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const ONBOARDING_KEY = "@atlas_has_seen_onboarding";

export function useOnboardingStatus() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasSeenOnboarding(value === "true");
      } catch {
        setHasSeenOnboarding(false);
      }
    }
    load();
  }, []);

  const markOnboardingSeen = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setHasSeenOnboarding(true);
  };

  return { hasSeenOnboarding, isLoading: hasSeenOnboarding === null, markOnboardingSeen };
}
