import { getLocales } from "expo-localization";

export type AppLanguagePreference = "system" | "fr" | "en";
export type SupportedAppLanguage = "fr" | "en";

export const APP_LANGUAGE_STORAGE_KEY = "@atlas/language-preference/v1";
export const appLanguagePreferences = ["system", "fr", "en"] as const;

export function isAppLanguagePreference(value: string | null | undefined): value is AppLanguagePreference {
  return value === "system" || value === "fr" || value === "en";
}

export function getDeviceAppLanguage(): SupportedAppLanguage {
  const deviceLanguage = getLocales()[0]?.languageCode?.toLowerCase();
  return deviceLanguage === "fr" ? "fr" : "en";
}

export function languageCodeForPreference(preference: AppLanguagePreference): SupportedAppLanguage {
  return preference === "system" ? getDeviceAppLanguage() : preference;
}
