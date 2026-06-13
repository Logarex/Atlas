import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const ONBOARDING_KEY = "@atlas_has_seen_onboarding";

// Share state across hook instances
let globalHasSeenOnboarding: boolean | null = null;
const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export function useOnboardingStatus() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(globalHasSeenOnboarding);

  useEffect(() => {
    const listener = () => setHasSeenOnboarding(globalHasSeenOnboarding);
    listeners.add(listener);

    async function load() {
      if (globalHasSeenOnboarding === null) {
        try {
          const value = await AsyncStorage.getItem(ONBOARDING_KEY);
          globalHasSeenOnboarding = value === "true";
        } catch {
          globalHasSeenOnboarding = false;
        }
        notifyListeners();
      }
    }

    if (globalHasSeenOnboarding === null) {
      load();
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const markOnboardingSeen = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    globalHasSeenOnboarding = true;
    notifyListeners();
  };

  return { hasSeenOnboarding, isLoading: hasSeenOnboarding === null, markOnboardingSeen };
}
