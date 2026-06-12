import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useMemo, useState } from "react";

import { readLocalVisits, replaceLocalVisits } from "@/features/visits/localVisits";
import { APP_LANGUAGE_STORAGE_KEY, isAppLanguagePreference } from "@/lib/appLanguage";

import type { LocalVisit } from "@/features/visits/visit.types";

const LOCAL_PHOTOS_KEY = "@atlas/local-user-photos/v1";
const PROFILE_KEY = "@atlas/local-profile/v1";
const THEME_KEY = "@atlas/theme-setting/v1";
const IMAGE_CACHE_KEY = "@atlas/image-cache-preference/v1";
const EXPORT_SCHEMA_VERSION = 1;

export type LocalUserPhoto = {
  id: string;
  storeId: string;
  uri: string;
  fileName: string;
  mimeType?: string | null;
  caption?: string;
  takenOn?: string;
  createdAt: string;
  updatedAt: string;
};

type ExportedLocalUserPhoto = LocalUserPhoto & {
  exportFileName?: string;
};

type AtlasUserDataExport = {
  app: "Atlas Places";
  exportedAt: string;
  schemaVersion: number;
  profile: unknown | null;
  settings: {
    imageCache: string | null;
    language: string | null;
    theme: string | null;
  };
  visits: LocalVisit[];
  privatePhotos: ExportedLocalUserPhoto[];
  summary: {
    privatePhotoCount: number;
    visitCount: number;
  };
};

type LocalPhotosListener = (photos: LocalUserPhoto[]) => void;

const listeners = new Set<LocalPhotosListener>();

function notifyLocalPhotoListeners(photos: LocalUserPhoto[]) {
  for (const listener of listeners) {
    listener(photos);
  }
}

function safeDocumentDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error("Le dossier local Atlas Places est indisponible sur cet appareil.");
  }

  return FileSystem.documentDirectory;
}

function joinUri(directoryUri: string, name: string) {
  return `${directoryUri.replace(/\/?$/, "/")}${name}`;
}

function cleanFileName(value: string | null | undefined, fallback: string) {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || fallback;
}

function extensionForAsset(fileName?: string | null, mimeType?: string | null) {
  const fileExtension = fileName?.match(/\.[a-z0-9]+$/i)?.[0];
  if (fileExtension) return fileExtension.toLowerCase();
  if (mimeType?.includes("png")) return ".png";
  if (mimeType?.includes("webp")) return ".webp";
  if (mimeType?.includes("heic")) return ".heic";
  return ".jpg";
}

async function ensureDirectory(uri: string) {
  await FileSystem.makeDirectoryAsync(uri, { intermediates: true }).catch(() => {});
}

function localPhotosDirectory() {
  return joinUri(safeDocumentDirectory(), "atlas-private-photos");
}

function parseStoredJson(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function readLocalUserPhotos() {
  const raw = await AsyncStorage.getItem(LOCAL_PHOTOS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalUserPhoto[]) : [];
  } catch {
    return [];
  }
}

async function writeLocalUserPhotos(photos: LocalUserPhoto[]) {
  await AsyncStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify(photos));
}

export async function saveLocalUserPhoto(input: {
  caption?: string;
  fileName?: string | null;
  mimeType?: string | null;
  sourceUri: string;
  storeId: string;
  takenOn?: string;
}) {
  const now = new Date().toISOString();
  const directory = localPhotosDirectory();
  await ensureDirectory(directory);

  const extension = extensionForAsset(input.fileName, input.mimeType);
  const baseName = cleanFileName(input.fileName?.replace(/\.[a-z0-9]+$/i, ""), "photo");
  const fileName = `${Date.now()}-${baseName}${extension}`;
  const uri = joinUri(directory, fileName);

  await FileSystem.copyAsync({ from: input.sourceUri, to: uri });

  const photo: LocalUserPhoto = {
    id: `${input.storeId}:${now}`,
    storeId: input.storeId,
    uri,
    fileName,
    mimeType: input.mimeType,
    ...(input.caption?.trim() ? { caption: input.caption.trim() } : {}),
    ...(input.takenOn ? { takenOn: input.takenOn } : {}),
    createdAt: now,
    updatedAt: now
  };

  const nextPhotos = [photo, ...(await readLocalUserPhotos())];
  await writeLocalUserPhotos(nextPhotos);
  notifyLocalPhotoListeners(nextPhotos);
  return photo;
}

export async function removeLocalUserPhoto(photoId: string) {
  const photos = await readLocalUserPhotos();
  const photo = photos.find((item) => item.id === photoId);
  const nextPhotos = photos.filter((item) => item.id !== photoId);

  if (photo?.uri) {
    await FileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(() => {});
  }

  await writeLocalUserPhotos(nextPhotos);
  notifyLocalPhotoListeners(nextPhotos);
}

export async function clearLocalUserPhotos() {
  await AsyncStorage.removeItem(LOCAL_PHOTOS_KEY);
  await FileSystem.deleteAsync(localPhotosDirectory(), { idempotent: true }).catch(() => {});
  notifyLocalPhotoListeners([]);
}

export async function exportLocalUserData() {
  const exportedAt = new Date().toISOString();
  const exportId = exportedAt.replace(/[:.]/g, "-");
  const exportDirectory = joinUri(safeDocumentDirectory(), `atlas-export-${exportId}`);
  const exportPhotosDirectory = joinUri(exportDirectory, "photos");
  const manifestUri = joinUri(exportDirectory, "atlas-user-data.json");
  const [visits, privatePhotos, profileRaw, theme, imageCache, language] = await Promise.all([
    readLocalVisits(),
    readLocalUserPhotos(),
    AsyncStorage.getItem(PROFILE_KEY),
    AsyncStorage.getItem(THEME_KEY),
    AsyncStorage.getItem(IMAGE_CACHE_KEY),
    AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY)
  ]);

  await ensureDirectory(exportDirectory);
  await ensureDirectory(exportPhotosDirectory);

  const exportedPhotos: ExportedLocalUserPhoto[] = [];
  for (const photo of privatePhotos) {
    const exportFileName = cleanFileName(photo.fileName, `${photo.id}.jpg`);
    const destination = joinUri(exportPhotosDirectory, exportFileName);
    await FileSystem.copyAsync({ from: photo.uri, to: destination }).catch(() => {});
    exportedPhotos.push({ ...photo, exportFileName });
  }

  const payload: AtlasUserDataExport = {
    app: "Atlas Places",
    exportedAt,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    profile: parseStoredJson(profileRaw),
    settings: { imageCache, language, theme },
    visits,
    privatePhotos: exportedPhotos,
    summary: {
      privatePhotoCount: privatePhotos.length,
      visitCount: visits.length
    }
  };

  await FileSystem.writeAsStringAsync(manifestUri, JSON.stringify(payload, null, 2));

  return {
    directoryUri: exportDirectory,
    manifestUri,
    privatePhotoCount: privatePhotos.length,
    visitCount: visits.length
  };
}

function mergeVisits(currentVisits: LocalVisit[], importedVisits: LocalVisit[]) {
  const byKey = new Map<string, LocalVisit>();

  for (const visit of [...currentVisits, ...importedVisits]) {
    if (!visit?.storeId || !visit?.visitedOn) continue;
    byKey.set(visit.id || `${visit.storeId}:${visit.visitedOn}`, visit);
  }

  return [...byKey.values()];
}

async function importPrivatePhoto(photo: ExportedLocalUserPhoto, baseDirectoryUri?: string) {
  const directory = localPhotosDirectory();
  await ensureDirectory(directory);

  const sourceUri = photo.exportFileName && baseDirectoryUri
    ? joinUri(joinUri(baseDirectoryUri, "photos"), photo.exportFileName)
    : photo.uri;
  const sourceInfo = await FileSystem.getInfoAsync(sourceUri).catch(() => ({ exists: false }));
  if (!sourceInfo.exists) return null;

  const destinationName = `${Date.now()}-${cleanFileName(photo.fileName, photo.exportFileName ?? "photo.jpg")}`;
  const destinationUri = joinUri(directory, destinationName);
  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });

  const now = new Date().toISOString();
  return {
    ...photo,
    id: photo.id || `${photo.storeId}:${now}`,
    uri: destinationUri,
    fileName: destinationName,
    updatedAt: now
  } satisfies LocalUserPhoto;
}

export async function importLocalUserDataFromJson(
  json: string,
  options?: { baseDirectoryUri?: string }
) {
  const parsed = JSON.parse(json) as Partial<AtlasUserDataExport>;
  const importedVisits = Array.isArray(parsed.visits) ? parsed.visits : [];
  const importedPhotos = Array.isArray(parsed.privatePhotos) ? parsed.privatePhotos : [];
  const [currentVisits, currentPhotos] = await Promise.all([
    readLocalVisits(),
    readLocalUserPhotos()
  ]);

  const nextVisits = mergeVisits(currentVisits, importedVisits);
  await replaceLocalVisits(nextVisits);

  const restoredPhotos: LocalUserPhoto[] = [];
  for (const photo of importedPhotos) {
    if (!photo?.storeId) continue;
    const restored = await importPrivatePhoto(photo, options?.baseDirectoryUri);
    if (restored) restoredPhotos.push(restored);
  }

  const existingPhotoIds = new Set(currentPhotos.map((photo) => photo.id));
  const nextPhotos = [
    ...restoredPhotos.filter((photo) => !existingPhotoIds.has(photo.id)),
    ...currentPhotos
  ];

  await writeLocalUserPhotos(nextPhotos);
  notifyLocalPhotoListeners(nextPhotos);

  if (parsed.profile) {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(parsed.profile));
  }
  if (parsed.settings?.theme) {
    await AsyncStorage.setItem(THEME_KEY, parsed.settings.theme);
  }
  if (parsed.settings?.imageCache) {
    await AsyncStorage.setItem(IMAGE_CACHE_KEY, parsed.settings.imageCache);
  }
  if (isAppLanguagePreference(parsed.settings?.language)) {
    await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, parsed.settings.language);
  }

  return {
    privatePhotoCount: restoredPhotos.length,
    visitCount: importedVisits.length
  };
}

export async function importLocalUserDataFromPickedFile() {
  const pickedFile = await File.pickFileAsync(undefined, "application/json");
  const file = Array.isArray(pickedFile) ? pickedFile[0] : pickedFile;
  const json = await file.text();

  return importLocalUserDataFromJson(json, {
    baseDirectoryUri: file.parentDirectory.uri
  });
}

export function useLocalUserPhotos(storeId?: string) {
  const [photos, setPhotos] = useState<LocalUserPhoto[]>([]);

  useEffect(() => {
    let isMounted = true;

    readLocalUserPhotos().then((loadedPhotos) => {
      if (isMounted) setPhotos(loadedPhotos);
    });

    const listener: LocalPhotosListener = (updatedPhotos) => {
      setPhotos(updatedPhotos);
    };
    listeners.add(listener);

    return () => {
      isMounted = false;
      listeners.delete(listener);
    };
  }, []);

  const storePhotos = useMemo(() => {
    if (!storeId) return [];
    return photos.filter((photo) => photo.storeId === storeId);
  }, [photos, storeId]);

  return {
    photos,
    storePhotos
  };
}
