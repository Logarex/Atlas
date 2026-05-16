export const colors = {
  canvas: "#F7F7F8", // Plus clair, style Apple
  paper: "#FFFFFF",
  ink: "#000000",
  muted: "#8E8E93", // Gris standard iOS
  line: "#E5E5EA",
  copper: "#007AFF", // Bleu iOS pour les actions
  teal: "#34C759", // Vert iOS
  moss: "#34C759",
  rose: "#FF3B30",
  mint: "#E8F2E6",
  sky: "#F2F2F7",
  gold: "#FFCC00",
  danger: "#FF3B30",
  overlay: "rgba(0,0,0,0.5)"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
} as const;

export const typography = {
  caption: 12,
  small: 14,
  body: 16,
  title3: 20,
  title2: 24,
  title1: 32
} as const;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 999
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4
  }
} as const;
