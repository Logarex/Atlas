import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import { useEffect, useState } from "react";

export type ImageCachePreference = "light" | "balanced" | "large";

type ImageCacheProfile = {
  maxDiskSize: number;
  maxMemoryCost: number;
  maxMemoryCount: number;
};

const STORAGE_KEY = "@atlas/image-cache-preference/v1";
const megabyte = 1024 * 1024;

export const imageCacheProfiles: Record<ImageCachePreference, ImageCacheProfile> = {
  light: {
    maxDiskSize: 32 * megabyte,
    maxMemoryCost: 20 * megabyte,
    maxMemoryCount: 48
  },
  balanced: {
    maxDiskSize: 128 * megabyte,
    maxMemoryCost: 48 * megabyte,
    maxMemoryCount: 120
  },
  large: {
    maxDiskSize: 384 * megabyte,
    maxMemoryCost: 96 * megabyte,
    maxMemoryCount: 240
  }
};

function isImageCachePreference(value: string | null): value is ImageCachePreference {
  return value === "light" || value === "balanced" || value === "large";
}

export function applyImageCachePreference(preference: ImageCachePreference) {
  try {
    ExpoImage.configureCache(imageCacheProfiles[preference]);
  } catch {
    // Android already enforces its own cache policy; iOS accepts explicit limits here.
  }
}

export async function readImageCachePreference(): Promise<ImageCachePreference> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return isImageCachePreference(stored) ? stored : "balanced";
}

export async function saveImageCachePreference(preference: ImageCachePreference) {
  await AsyncStorage.setItem(STORAGE_KEY, preference);
  applyImageCachePreference(preference);
}

export async function clearImageCache() {
  await ExpoImage.clearMemoryCache().catch(() => false);
  await ExpoImage.clearDiskCache().catch(() => false);
}

export function useImageCachePreference() {
  const [preference, setPreferenceState] = useState<ImageCachePreference>("balanced");

  useEffect(() => {
    let isMounted = true;

    readImageCachePreference().then((storedPreference) => {
      applyImageCachePreference(storedPreference);
      if (isMounted) setPreferenceState(storedPreference);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function setPreference(nextPreference: ImageCachePreference) {
    setPreferenceState(nextPreference);
    await saveImageCachePreference(nextPreference);
  }

  return {
    preference,
    setPreference
  };
}
