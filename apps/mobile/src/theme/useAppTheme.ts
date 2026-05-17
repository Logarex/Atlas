import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useColorScheme, Platform, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { spacing, typography, radii, shadows } from "./tokens";

const STORAGE_KEY = "@atlas/theme-setting/v1";

const { AppIconModule } = NativeModules;

export type ThemeSetting = "system" | "light" | "dark";

// Helper to set alternate icon on iOS
async function syncAppIcon(themeSetting: ThemeSetting) {
  if (Platform.OS !== "ios" || !AppIconModule) return;
  try {
    const targetIcon = themeSetting === "system" ? null : (themeSetting === "light" ? "AppIcon-Light" : "AppIcon-Dark");
    await AppIconModule.setAlternateIconName(targetIcon);
  } catch (error) {
    console.error("Failed to sync app icon:", error);
  }
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

  // Load from AsyncStorage
  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "system" || saved === "light" || saved === "dark") {
          setThemeSettingState(saved);
          void syncAppIcon(saved);
        }
      } catch (error) {
        console.error("Failed to load theme setting:", error);
      }
    }
    void loadTheme();
  }, []);

  const setThemeSetting = async (setting: ThemeSetting) => {
    setThemeSettingState(setting);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, setting);
      void syncAppIcon(setting);
    } catch (error) {
      console.error("Failed to save theme setting:", error);
    }
  };

  // Sync icon when system scheme changes, in case themeSetting is "system"
  useEffect(() => {
    if (themeSetting === "system") {
      void syncAppIcon("system");
    }
  }, [systemScheme, themeSetting]);

  const isDark = useMemo(() => {
    if (themeSetting === "system") {
      return systemScheme === "dark";
    }
    return themeSetting === "dark";
  }, [themeSetting, systemScheme]);

  const colors = isDark ? solarizedDarkColors : solarizedLightColors;

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

