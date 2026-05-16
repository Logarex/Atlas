import { useColorScheme } from "react-native";
import { spacing, typography, radii, shadows } from "./tokens";

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

export function useAppTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? solarizedDarkColors : solarizedLightColors;

  return {
    colors,
    spacing,
    typography,
    radii,
    shadows,
    isDark
  };
}

// Pour des cas où l'on a absolument besoin des couleurs de base hors React, 
// on exporte la version light par défaut.
export const defaultColors = solarizedLightColors;
