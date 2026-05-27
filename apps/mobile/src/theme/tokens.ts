export const colors = {
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
