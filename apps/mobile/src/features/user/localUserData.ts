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
const ROMANIZED_NAMES_KEY = "@atlas/romanized-names-preference/v1";
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

type ExportedLocalVisit = LocalVisit & {
  exportAudioFileName?: string;
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
    romanizedNames: boolean;
  };
  visits: ExportedLocalVisit[];
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

async function runInBatches<T, R>(items: T[], batchSize: number, processItem: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processItem));
    results.push(...batchResults);
  }
  return results;
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
  const exportAudiosDirectory = joinUri(exportDirectory, "audios");
  const manifestUri = joinUri(exportDirectory, "atlas-user-data.json");
  const [visits, privatePhotos, profileRaw, theme, imageCache, language, romanizedStr] = await Promise.all([
    readLocalVisits(),
    readLocalUserPhotos(),
    AsyncStorage.getItem(PROFILE_KEY),
    AsyncStorage.getItem(THEME_KEY),
    AsyncStorage.getItem(IMAGE_CACHE_KEY),
    AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY),
    AsyncStorage.getItem(ROMANIZED_NAMES_KEY)
  ]);
  const useRomanizedNames = language === "true"; // wait, the 7th element is romanizedNames
  await ensureDirectory(exportDirectory);
  await ensureDirectory(exportPhotosDirectory);
  await ensureDirectory(exportAudiosDirectory);

  let failedCount = 0;

  const exportedPhotos = (await runInBatches(privatePhotos, 5, async (photo) => {
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const exportFileName = `${uniqueId}-${cleanFileName(photo.fileName, `${photo.id}.jpg`)}`;
    const destination = joinUri(exportPhotosDirectory, exportFileName);
    try {
      await FileSystem.copyAsync({ from: photo.uri, to: destination });
      return { ...photo, exportFileName };
    } catch {
      failedCount++;
      return null;
    }
  })).filter(Boolean) as ExportedLocalUserPhoto[];

  const exportedVisits = (await runInBatches(visits, 5, async (visit) => {
    if (!visit.audioUri) return visit as ExportedLocalVisit;

    const sourceInfo = await FileSystem.getInfoAsync(visit.audioUri).catch(() => ({ exists: false }));
    if (!sourceInfo.exists) return visit as ExportedLocalVisit;

    const extension = extensionForAsset(visit.audioUri) || ".m4a";
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const exportFileName = `${uniqueId}-audio${extension}`;
    const destination = joinUri(exportAudiosDirectory, exportFileName);

    try {
      await FileSystem.copyAsync({ from: visit.audioUri, to: destination });
      return { ...visit, exportAudioFileName: exportFileName } as ExportedLocalVisit;
    } catch {
      failedCount++;
      return visit as ExportedLocalVisit;
    }
  }));

  if (failedCount > 0) {
    throw new Error(`${failedCount} fichier(s) (photo ou audio) n'ont pas pu être exportés. Vérifiez l'espace disponible.`);
  }

  const payload: AtlasUserDataExport = {
    app: "Atlas Places",
    exportedAt,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    profile: parseStoredJson(profileRaw),
    settings: { imageCache, language, theme, romanizedNames: romanizedStr === "true" },
    visits: exportedVisits,
    privatePhotos: exportedPhotos,
    summary: {
      privatePhotoCount: exportedPhotos.length,
      visitCount: exportedVisits.length
    }
  };

  await FileSystem.writeAsStringAsync(manifestUri, JSON.stringify(payload, null, 2));

  return {
    directoryUri: exportDirectory,
    manifestUri,
    privatePhotoCount: exportedPhotos.length,
    visitCount: exportedVisits.length
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

  const uniqueId = Math.random().toString(36).substring(2, 9);
  const destinationName = `${Date.now()}-${uniqueId}-${cleanFileName(photo.fileName, photo.exportFileName ?? "photo.jpg")}`;
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

async function importAudio(visit: ExportedLocalVisit, baseDirectoryUri?: string): Promise<LocalVisit> {
  if (!visit.exportAudioFileName || !baseDirectoryUri) return visit;

  const directory = joinUri(safeDocumentDirectory(), "atlas-private-audios");
  await ensureDirectory(directory);

  const sourceUri = joinUri(joinUri(baseDirectoryUri, "audios"), visit.exportAudioFileName);
  const sourceInfo = await FileSystem.getInfoAsync(sourceUri).catch(() => ({ exists: false }));
  if (!sourceInfo.exists) return visit;

  const uniqueId = Math.random().toString(36).substring(2, 9);
  const destinationName = `${Date.now()}-${uniqueId}-${visit.exportAudioFileName}`;
  const destinationUri = joinUri(directory, destinationName);
  
  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });

  return {
    ...visit,
    audioUri: destinationUri
  };
}

export async function importLocalUserDataFromJson(
  json: string,
  options?: { baseDirectoryUri?: string }
) {
  const parsed = JSON.parse(json) as Partial<AtlasUserDataExport>;
  const importedVisitsRaw = Array.isArray(parsed.visits) ? parsed.visits : [];
  const importedPhotos = Array.isArray(parsed.privatePhotos) ? parsed.privatePhotos : [];
  const [currentVisits, currentPhotos] = await Promise.all([
    readLocalVisits(),
    readLocalUserPhotos()
  ]);

  let failedCount = 0;

  const importedVisits = await runInBatches(importedVisitsRaw, 5, async (visit) => {
    try {
      return await importAudio(visit, options?.baseDirectoryUri);
    } catch {
      failedCount++;
      return visit;
    }
  });

  const restoredPhotos = (await runInBatches(importedPhotos, 5, async (photo) => {
    if (!photo?.storeId) return null;
    try {
      return await importPrivatePhoto(photo, options?.baseDirectoryUri);
    } catch {
      failedCount++;
      return null;
    }
  })).filter(Boolean) as LocalUserPhoto[];

  if (failedCount > 0) {
    throw new Error(`${failedCount} fichier(s) (photo ou audio) n'ont pas pu être importés. Vérifiez l'espace disponible.`);
  }

  const nextVisits = mergeVisits(currentVisits, importedVisits);
  await replaceLocalVisits(nextVisits);

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
  if (parsed.settings?.romanizedNames !== undefined) {
    await AsyncStorage.setItem(ROMANIZED_NAMES_KEY, parsed.settings.romanizedNames ? "true" : "false");
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


export function useRomanizedNamesPreference() {
  const [preference, setPreferenceState] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(ROMANIZED_NAMES_KEY).then((value) => {
      if (isMounted) setPreferenceState(value === null ? true : value === "true");
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const setPreference = async (nextPreference: boolean) => {
    setPreferenceState(nextPreference);
    await AsyncStorage.setItem(ROMANIZED_NAMES_KEY, nextPreference ? "true" : "false");
  };

  return { preference, setPreference };
}
