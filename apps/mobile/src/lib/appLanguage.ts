import { getLocales } from "expo-localization";

export type AppLanguagePreference = "system" | "fr" | "en" | "es" | "it" | "de";
export type SupportedAppLanguage = "fr" | "en" | "es" | "it" | "de";

export const APP_LANGUAGE_STORAGE_KEY = "@atlas/language-preference/v1";
export const appLanguagePreferences = ["system", "fr", "en", "es", "it", "de"] as const;

export function isAppLanguagePreference(value: string | null | undefined): value is AppLanguagePreference {
  return value === "system" || value === "fr" || value === "en" || value === "es" || value === "it" || value === "de";
}

export function getDeviceAppLanguage(): SupportedAppLanguage {
  const deviceLanguage = getLocales()[0]?.languageCode?.toLowerCase();
  if (deviceLanguage === "fr" || deviceLanguage === "es" || deviceLanguage === "it" || deviceLanguage === "de") {
    return deviceLanguage as SupportedAppLanguage;
  }
  return "en";
}

export function languageCodeForPreference(preference: AppLanguagePreference): SupportedAppLanguage {
  return preference === "system" ? getDeviceAppLanguage() : preference;
}
