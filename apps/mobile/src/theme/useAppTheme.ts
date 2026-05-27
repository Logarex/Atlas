import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useColorScheme, Platform, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { spacing, typography, radii, shadows } from "./tokens";

const STORAGE_KEY = "@atlas/theme-setting/v1";

const { AppIconModule } = NativeModules;

export type ThemeSetting = "system" | "light" | "dark";

type AppIconName = "AppIcon-Dark" | null;

function iconNameForThemeSetting(setting: ThemeSetting): AppIconName {
  return setting === "dark" ? "AppIcon-Dark" : null;
}

async function setNativeAppIcon(iconName: AppIconName) {
  if (Platform.OS !== "ios" || !AppIconModule) return;

  try {
    const currentIconName = await AppIconModule.getAlternateIconName();
    if (currentIconName === iconName) return;

    await AppIconModule.setAlternateIconName(iconName ?? "");
  } catch {
    // iOS may reject runtime icon changes; the primary asset catalog still provides system dark icons.
  }
}

const atlasLightColors = {
  canvas: "#F7F1E5",
  paper: "#FFFDF8",
  ink: "#263322",
  muted: "#766D5A",
  line: "#DED3BF",
  copper: "#C85B36",
  teal: "#5F9F47",
  moss: "#789B3D",
  rose: "#B94A40",
  mint: "#E8F3DE",
  sky: "#EFE8D7",
  gold: "#D3A51F",
  danger: "#C23A33",
  overlay: "rgba(32,32,32,0.48)",
  transparent: "transparent"
};

const atlasDarkColors = {
  canvas: "#1D1D1F",
  paper: "#28251D",
  ink: "#F4EFE4",
  muted: "#B9AE97",
  line: "#47412F",
  copper: "#EA6A3D",
  teal: "#7BC35D",
  moss: "#9BD45A",
  rose: "#E06A63",
  mint: "#223A1C",
  sky: "#37301F",
  gold: "#F0C542",
  danger: "#FF6B5D",
  overlay: "rgba(0,0,0,0.72)",
  transparent: "transparent"
};

interface ThemeContextType {
  themeSetting: ThemeSetting;
  setThemeSetting: (setting: ThemeSetting) => void;
  colors: typeof atlasLightColors;
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
        }
      } catch (error) {
        console.error("Failed to load theme setting:", error);
      }
    }
    void loadTheme();
  }, []);

  const setThemeSetting = async (setting: ThemeSetting) => {
    setThemeSettingState(setting);
    void setNativeAppIcon(iconNameForThemeSetting(setting));

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

  const colors = isDark ? atlasDarkColors : atlasLightColors;

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
  const colorsFallback = isDarkFallback ? atlasDarkColors : atlasLightColors;

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

export const defaultColors = atlasLightColors;
