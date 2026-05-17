import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { AppState, useColorScheme, Platform, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { spacing, typography, radii, shadows } from "./tokens";

const STORAGE_KEY = "@atlas/theme-setting/v1";

const { AppIconModule } = NativeModules;

export type ThemeSetting = "system" | "light" | "dark";

type AppIconName = "AppIcon-Dark" | null;

let requestedIconName: AppIconName = null;
let hasPendingIconRequest = false;
let currentIconSync: Promise<void> | null = null;
let temporaryIconRetryCount = 0;

function iconNameForTheme(isDark: boolean): AppIconName {
  return isDark ? "AppIcon-Dark" : null;
}

function isTemporaryIconError(error: unknown) {
  const code = (error as { code?: string }).code;
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return code === "APP_INACTIVE"
    || message.includes("temporarily unavailable")
    || message.includes("ressources temporairement indisponibles");
}

function isCancelledIconError(error: unknown) {
  const code = (error as { code?: string }).code;
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return code === "CANCELLED"
    || message.includes("cancelled")
    || message.includes("canceled")
    || message.includes("annul");
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function setNativeAppIcon(iconName: AppIconName) {
  if (Platform.OS !== "ios" || !AppIconModule) return;

  const currentIconName = await AppIconModule.getAlternateIconName();
  if (currentIconName === iconName) return;

  await AppIconModule.setAlternateIconName(iconName ?? "");
}

async function drainIconSyncQueue() {
  if (currentIconSync) return currentIconSync;

  currentIconSync = (async () => {
    while (hasPendingIconRequest) {
      const iconName = requestedIconName;
      hasPendingIconRequest = false;

      if (AppState.currentState !== "active") {
        requestedIconName = iconName;
        hasPendingIconRequest = true;
        break;
      }

      try {
        await wait(350);
        await setNativeAppIcon(iconName);
        temporaryIconRetryCount = 0;
      } catch (error) {
        if ((error as { code?: string }).code === "NOT_SUPPORTED") {
          continue;
        }

        if (isTemporaryIconError(error)) {
          if (temporaryIconRetryCount < 3) {
            temporaryIconRetryCount += 1;
            requestedIconName = iconName;
            hasPendingIconRequest = true;
            await wait(1200);
            continue;
          }

          temporaryIconRetryCount = 0;
          return;
        }

        if (isCancelledIconError(error)) {
          temporaryIconRetryCount = 0;
          return;
        }

        console.error("Failed to sync app icon:", error);
      }
    }
  })().finally(() => {
    currentIconSync = null;
    if (hasPendingIconRequest && AppState.currentState === "active") {
      void drainIconSyncQueue();
    }
  });

  return currentIconSync;
}

function syncAppIcon(isDark: boolean) {
  if (Platform.OS !== "ios" || !AppIconModule) return;

  requestedIconName = iconNameForTheme(isDark);
  hasPendingIconRequest = true;
  void drainIconSyncQueue();
}

const solarizedLightColors = {
  canvas: "#fdf6e3", // base3
  paper: "#eee8d5", // base2
  ink: "#002b36", // base03 (for strong contrast) or #657b83 (base00) - let's use base03 for readability
  muted: "#657b83", // base00
  line: "#93a1a1", // base1
  copper: "#cb4b16", // orange
  teal: "#2aa198", // cyan
  moss: "#859900", // green
  rose: "#dc322f", // red
  mint: "#e8f2e6",
  sky: "#e5eff5",
  gold: "#b58900", // yellow
  danger: "#dc322f",
  overlay: "rgba(0,43,54,0.5)",
  transparent: "transparent"
};

const solarizedDarkColors = {
  canvas: "#002b36", // base03
  paper: "#073642", // base02
  ink: "#93a1a1", // base1
  muted: "#586e75", // base01
  line: "#586e75", // base01
  copper: "#cb4b16", // orange
  teal: "#2aa198", // cyan
  moss: "#859900", // green
  rose: "#dc322f", // red
  mint: "#0f3a3c",
  sky: "#0a3642",
  gold: "#b58900", // yellow
  danger: "#dc322f",
  overlay: "rgba(0,43,54,0.8)",
  transparent: "transparent"
};

interface ThemeContextType {
  themeSetting: ThemeSetting;
  setThemeSetting: (setting: ThemeSetting) => void;
  colors: typeof solarizedLightColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeSetting, setThemeSettingState] = useState<ThemeSetting>("system");
  const [hasLoadedThemeSetting, setHasLoadedThemeSetting] = useState(false);

  // Load from AsyncStorage
  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "system" || saved === "light" || saved === "dark") {
          setThemeSettingState(saved);
        }
      } catch (error) {
        console.error("Failed to load theme setting:", error);
      } finally {
        setHasLoadedThemeSetting(true);
      }
    }
    void loadTheme();
  }, []);

  const setThemeSetting = async (setting: ThemeSetting) => {
    setThemeSettingState(setting);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, setting);
    } catch (error) {
      console.error("Failed to save theme setting:", error);
    }
  };

  const isDark = useMemo(() => {
    if (themeSetting === "system") {
      return systemScheme === "dark";
    }
    return themeSetting === "dark";
  }, [themeSetting, systemScheme]);

  const colors = isDark ? solarizedDarkColors : solarizedLightColors;

  useEffect(() => {
    if (!hasLoadedThemeSetting) return;

    syncAppIcon(isDark);
  }, [hasLoadedThemeSetting, isDark]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncAppIcon(isDark);
      }
    });

    return () => subscription.remove();
  }, [isDark]);

  const value = useMemo(
    () => ({
      themeSetting,
      setThemeSetting,
      colors,
      isDark
    }),
    [themeSetting, colors, isDark]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  
  // Fallback to system if used outside provider
  const systemScheme = useColorScheme();
  const isDarkFallback = systemScheme === "dark";
  const colorsFallback = isDarkFallback ? solarizedDarkColors : solarizedLightColors;

  const themeSetting = context ? context.themeSetting : "system";
  const setThemeSetting = context ? context.setThemeSetting : () => {};
  const isDark = context ? context.isDark : isDarkFallback;
  const colors = context ? context.colors : colorsFallback;

  return {
    colors,
    spacing,
    typography,
    radii,
    shadows,
    isDark,
    themeSetting,
    setThemeSetting
  };
}

export const defaultColors = solarizedLightColors;
