import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import {
  APP_LANGUAGE_STORAGE_KEY,
  isAppLanguagePreference,
  languageCodeForPreference,
  type AppLanguagePreference
} from "@/lib/appLanguage";
import i18n from "@/lib/i18n";

export async function readLanguagePreference(): Promise<AppLanguagePreference> {
  const stored = await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
  return isAppLanguagePreference(stored) ? stored : "system";
}

export async function applyLanguagePreference(preference: AppLanguagePreference) {
  const language = languageCodeForPreference(preference);
  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }
}

export async function saveLanguagePreference(preference: AppLanguagePreference) {
  await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, preference);
  await applyLanguagePreference(preference);
}

export function useLanguagePreference() {
  const [preference, setPreferenceState] = useState<AppLanguagePreference>("system");

  useEffect(() => {
    let isMounted = true;

    readLanguagePreference().then((storedPreference) => {
      void applyLanguagePreference(storedPreference);
      if (isMounted) setPreferenceState(storedPreference);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function setPreference(nextPreference: AppLanguagePreference) {
    setPreferenceState(nextPreference);
    await saveLanguagePreference(nextPreference);
  }

  return {
    preference,
    setPreference
  };
}
