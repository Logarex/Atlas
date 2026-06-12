import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Atlas",
  slug: "atlas",
  scheme: "atlas",
  version: "0.0.1",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  locales: {
    en: "./src/i18n/infoPlist/en.json",
    fr: "./src/i18n/infoPlist/fr.json",
    es: "./src/i18n/infoPlist/es.json",
    it: "./src/i18n/infoPlist/it.json",
    de: "./src/i18n/infoPlist/de.json"
  },
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.louischabert.atlas",
    icon: {
      light: "./assets/icon.png",
      dark: "./assets/icon-dark.png"
    },
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        "Atlas lets you choose photos you own to save them locally or submit them for review.",
      NSPhotoLibraryAddUsageDescription:
        "Atlas may save exported visit photos when you choose to share or back up your local data.",
      NSCameraUsageDescription:
        "Atlas can use the camera if you choose to add a personal store photo."
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
    }
  },
  plugins: [
    "expo-router",
    "expo-localization",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Atlas lets you choose photos you own to save them locally or submit them for review."
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  }
});
