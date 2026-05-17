import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Atlas",
  slug: "atlas",
  scheme: "atlas",
  version: "0.0.1",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.louischabert.atlas",
    icon: "./assets/icon.png",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Atlas uses your location locally to show nearby stores.",
      NSPhotoLibraryUsageDescription:
        "Atlas lets you choose photos you own before submitting them for review."
    }
  },
  android: {
    package: "com.louischabert.atlas",
    icon: "./assets/icon.png",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#E9E1D1"
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"]
  },
  plugins: [
    "expo-router",
    "expo-localization",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Atlas lets you choose photos you own before submitting them for review."
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  }
});
