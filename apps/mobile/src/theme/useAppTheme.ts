import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useColorScheme, Platform, NativeModules, AppState, type ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { spacing, typography, radii, shadows } from "./tokens";

const STORAGE_KEY = "@atlas/theme-setting/v1";

const { AppIconModule } = NativeModules;

export type ThemeSetting = "system" | "light" | "dark";

type AppIconName = "AppIcon-Light" | "AppIcon-Dark";

function iconNameForThemeSetting(
  setting: ThemeSetting,
  systemScheme: ColorSchemeName
): AppIconName {
  if (setting === "system") {
    return systemScheme === "dark" ? "AppIcon-Dark" : "AppIcon-Light";
  }

  return setting === "dark" ? "AppIcon-Dark" : "AppIcon-Light";
}

async function setNativeAppIcon(iconName: AppIconName) {
  if (Platform.OS !== "ios" || !AppIconModule) return;

  try {
    const currentIconName = await AppIconModule.getAlternateIconName();
    if (currentIconName === iconName) return;

    await AppIconModule.setAlternateIconName(iconName);
  } catch {
    // iOS may reject runtime icon changes while inactive; the next foreground theme pass retries it.
  }
}

const atlasLightColors = {
  canvas: "#F7F1E5",
  paper: "#FFFDF8",
  ink: "#263322",
  muted: "#766D5A",
  line: "#DED3BF",
  copper: "#C85B36",
  teal: "#6E8F4A",
  moss: "#858F45",
  rose: "#B94A40",
  mint: "#EDF0DA",
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
  teal: "#96B26B",
  moss: "#A5A967",
  rose: "#E06A63",
  mint: "#303720",
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

  const colors = isDark ? atlasDarkColors : atlasLightColors;

  useEffect(() => {
    if (!hasLoadedThemeSetting) return;

    void setNativeAppIcon(iconNameForThemeSetting(themeSetting, systemScheme));
  }, [hasLoadedThemeSetting, systemScheme, themeSetting]);

  // Re-apply the icon when the app comes back to the foreground.
  // iOS may have rejected the icon change while the app was inactive
  // (e.g. a system theme change happened in the background).
  useEffect(() => {
    if (!hasLoadedThemeSetting) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void setNativeAppIcon(iconNameForThemeSetting(themeSetting, systemScheme));
      }
    });

    return () => subscription.remove();
  }, [hasLoadedThemeSetting, themeSetting, systemScheme]);

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
