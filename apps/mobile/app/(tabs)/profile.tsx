import {
  submitStoreChange,
} from "@/features/contributions/contributionApi";
import { clearLocalProfile } from "@/features/social/socialApi";
import {
  clearLocalUserPhotos,
  exportLocalUserData,
  importLocalUserDataFromPickedFile,
  useLocalUserPhotos
} from "@/features/user/localUserData";
import {
  clearImageCache,
  useImageCachePreference,
  type ImageCachePreference
} from "@/features/stores/imageCache";
import { useLocalVisits } from "@/features/visits/localVisits";
import { appLanguagePreferences, type AppLanguagePreference } from "@/lib/appLanguage";
import { useLanguagePreference } from "@/lib/languagePreference";
import { useAppTheme } from "@/theme/useAppTheme";
import * as Sharing from "expo-sharing";
import {
  AlertTriangle,
  Download,
  HardDrive,
  Languages,
  Lock,
  Palette,
  RotateCcw,
  Scale,
  Send,
  Trash2,
  Upload,
  Users
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles(theme);

  const { clearAllVisits, visits } = useLocalVisits();
  const { photos } = useLocalUserPhotos();
  const { preference: imageCachePreference, setPreference: setImageCachePreference } =
    useImageCachePreference();
  const { preference: languagePreference, setPreference: setLanguagePreference } =
    useLanguagePreference();

  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreNote, setNewStoreNote] = useState("");
  const [newStoreContributorName, setNewStoreContributorName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function visitCountLabel(count: number) {
    return t("counts.visit", { count });
  }

  function privatePhotoCountLabel(count: number) {
    return t("counts.privatePhoto", { count });
  }

  async function handleDeleteData() {
    Alert.alert(
      t("profile.deleteWarningTitle"),
      t("profile.deleteWarningMessage"),
      [
        { text: t("profile.cancel"), style: "cancel" },
        {
          text: t("profile.confirmDelete"),
          style: "destructive",
          onPress: async () => {
            try {
              setMessage(t("profile.saving"));
              await clearLocalProfile();
              await clearAllVisits();
              await clearLocalUserPhotos();

              setMessage(t("profile.deleted"));
            } catch (error) {
              setMessage(error instanceof Error ? error.message : t("profile.failed"));
            }
          }
        }
      ]
    );
  }

  async function handleNewStoreProposal() {
    try {
      setMessage(t("profile.submittingStore"));
      await submitStoreChange({
        storeId: null,
        type: "new_store",
        proposedValue: newStoreName,
        note: newStoreNote,
        contributorName: newStoreContributorName
      });
      setNewStoreName("");
      setNewStoreNote("");
      setNewStoreContributorName("");
      setMessage(t("profile.storeSubmitted"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
  }

  async function handleExportData() {
    try {
      setMessage(t("profile.exporting"));
      const exportResult = await exportLocalUserData();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportResult.manifestUri, {
          dialogTitle: t("profile.export.shareTitle"),
          mimeType: "application/json",
          UTI: "public.json"
        });
      }
      setMessage(t("profile.export.done", {
        photosLabel: privatePhotoCountLabel(exportResult.privatePhotoCount),
        visitsLabel: visitCountLabel(exportResult.visitCount)
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
  }

  async function handleImportData() {
    try {
      setMessage(t("profile.importing"));
      const importResult = await importLocalUserDataFromPickedFile();
      setMessage(t("profile.import.done", {
        photosLabel: privatePhotoCountLabel(importResult.privatePhotoCount),
        visitsLabel: visitCountLabel(importResult.visitCount)
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
  }

  async function handleImageCachePreference(nextPreference: ImageCachePreference) {
    try {
      await setImageCachePreference(nextPreference);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
  }

  async function handleLanguagePreference(nextPreference: AppLanguagePreference) {
    try {
      await setLanguagePreference(nextPreference);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
  }

  async function handleClearImageCache() {
    try {
      await clearImageCache();
      setMessage(t("profile.cache.cleared"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing.lg }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>{t("profile.kicker")}</Text>
          <Text style={styles.title}>{t("profile.title")}</Text>
          <Text style={styles.subtitle}>{t("profile.subtitle")}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Send color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.newStore")}</Text>
          </View>
          <TextInput
            onChangeText={setNewStoreName}
            placeholder={t("profile.newStorePlaceholder")}
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            value={newStoreName}
          />
          <TextInput
            multiline
            onChangeText={setNewStoreNote}
            placeholder={t("profile.newStoreNote")}
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, styles.textArea]}
            value={newStoreNote}
          />
          <TextInput
            onChangeText={setNewStoreContributorName}
            placeholder={t("store.contributorNamePlaceholder")}
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            value={newStoreContributorName}
          />
          <Pressable
            disabled={newStoreName.trim().length === 0}
            onPress={handleNewStoreProposal}
            style={[
              styles.secondaryButton,
              newStoreName.trim().length === 0 && styles.disabledButton
            ]}
          >
            <Send color={theme.colors.copper} size={18} />
            <Text style={styles.secondaryButtonText}>{t("profile.submitStore")}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.theme.title")}</Text>
          </View>

          <View style={styles.themeSelectorRow}>
            {(["system", "light", "dark"] as const).map((mode) => {
              const isActive = theme.themeSetting === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => theme.setThemeSetting(mode)}
                  style={[
                    styles.themeButton,
                    isActive && styles.themeButtonActive
                  ]}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      isActive && styles.themeButtonTextActive
                    ]}
                  >
                    {t(`profile.theme.${mode}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Languages color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.language.title")}</Text>
          </View>

          <View style={styles.themeSelectorRow}>
            {appLanguagePreferences.map((language) => {
              const isActive = languagePreference === language;
              return (
                <Pressable
                  key={language}
                  onPress={() => handleLanguagePreference(language)}
                  style={[
                    styles.themeButton,
                    isActive && styles.themeButtonActive
                  ]}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      isActive && styles.themeButtonTextActive
                    ]}
                  >
                    {t(`profile.language.${language}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HardDrive color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.cache.title")}</Text>
          </View>

          <View style={styles.themeSelectorRow}>
            {(["light", "balanced", "large"] as const).map((cacheSize) => {
              const isActive = imageCachePreference === cacheSize;
              return (
                <Pressable
                  key={cacheSize}
                  onPress={() => handleImageCachePreference(cacheSize)}
                  style={[
                    styles.themeButton,
                    isActive && styles.themeButtonActive
                  ]}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      isActive && styles.themeButtonTextActive
                    ]}
                  >
                    {t(`profile.cache.${cacheSize}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={handleClearImageCache} style={styles.secondaryButton}>
            <RotateCcw color={theme.colors.copper} size={18} />
            <Text style={styles.secondaryButtonText}>{t("profile.cache.clear")}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Download color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.export.title")}</Text>
          </View>
          <Text style={styles.itemText}>
            {t("profile.export.subtitle", {
              photosLabel: privatePhotoCountLabel(photos.length),
              visitsLabel: visitCountLabel(visits.length)
            })}
          </Text>
          <View style={styles.inlineActions}>
            <Pressable
              onPress={handleExportData}
              style={[styles.secondaryButton, styles.inlineActionButton]}
            >
              <Download color={theme.colors.copper} size={18} />
              <Text style={styles.secondaryButtonText}>{t("profile.export.button")}</Text>
            </Pressable>
            <Pressable
              onPress={handleImportData}
              style={[styles.secondaryButton, styles.inlineActionButton]}
            >
              <Upload color={theme.colors.copper} size={18} />
              <Text style={styles.secondaryButtonText}>{t("profile.import.button")}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.privacyTitle")}</Text>
          </View>
          {(["noAds", "localLocation", "optionalAccount", "openData"] as const).map((key) => (
            <View key={key} style={styles.privacyRow}>
              <Text style={styles.privacyIcon}>✓</Text>
              <Text style={styles.itemText}>{t(`profile.privacy.${key}`)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.community.title")}</Text>
          </View>
          <Text style={styles.itemText}>{t("profile.community.body")}</Text>
          <View style={styles.licenseRow}>
            <Scale color={theme.colors.teal} size={18} />
            <Text style={styles.licenseText}>{t("profile.community.license")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle color={theme.colors.copper} size={22} />
            <Text style={[styles.sectionTitle, { color: theme.colors.copper }]}>
              {t("profile.dangerZone")}
            </Text>
          </View>
          <Pressable
            onPress={handleDeleteData}
            style={[styles.secondaryButton, { borderColor: theme.colors.copper }]}
          >
            <Trash2 color={theme.colors.copper} size={18} />
            <Text style={[styles.secondaryButtonText, { color: theme.colors.copper }]}>
              {t("profile.deleteAccount")}
            </Text>
          </Pressable>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, typography, spacing } = theme;

  return useMemo(() => StyleSheet.create({
    screen: {
      backgroundColor: colors.canvas,
      flex: 1
    },
    content: {
      paddingBottom: spacing.lg
    },
    header: {
      padding: spacing.lg
    },
    kicker: {
      color: colors.copper,
      fontSize: typography.caption,
      fontWeight: "700",
      letterSpacing: 0,
      textTransform: "uppercase"
    },
    title: {
      color: colors.ink,
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: 0,
      lineHeight: 36,
      marginTop: spacing.xs
    },
    subtitle: {
      color: colors.muted,
      fontSize: typography.body,
      lineHeight: 23,
      marginTop: spacing.sm
    },
    section: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      gap: spacing.md,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      padding: spacing.md
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "900"
    },
    itemTitle: {
      color: colors.ink,
      fontSize: typography.body,
      fontWeight: "800",
      letterSpacing: 0
    },
    itemText: {
      color: colors.muted,
      flex: 1,
      fontSize: typography.small,
      lineHeight: 20
    },
    input: {
      backgroundColor: colors.canvas,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.ink,
      fontSize: typography.body,
      height: 48,
      paddingHorizontal: spacing.md
    },
    textArea: {
      height: 92,
      paddingTop: spacing.md,
      textAlignVertical: "top"
    },
    secondaryButton: {
      alignItems: "center",
      backgroundColor: colors.canvas,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: spacing.md
    },
    inlineActionButton: {
      flex: 1
    },
    secondaryButtonText: {
      color: colors.copper,
      fontSize: typography.small,
      fontWeight: "900"
    },
    disabledButton: {
      opacity: 0.45
    },
    privacyRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.sm
    },
    privacyIcon: {
      color: colors.copper,
      fontSize: typography.body,
      fontWeight: "900"
    },
    themeSelectorRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs
    },
    inlineActions: {
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "center"
    },
    themeButton: {
      alignItems: "center",
      backgroundColor: colors.canvas,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: spacing.sm
    },
    themeButtonActive: {
      backgroundColor: colors.copper,
      borderColor: colors.copper
    },
    themeButtonText: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "800"
    },
    themeButtonTextActive: {
      color: colors.paper,
      fontWeight: "900"
    },
    message: {
      color: colors.copper,
      fontSize: typography.small,
      fontWeight: "700",
      lineHeight: 20,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md
    },
    licenseRow: {
      alignItems: "center",
      backgroundColor: colors.mint,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.md
    },
    licenseText: {
      color: colors.ink,
      flex: 1,
      fontSize: typography.small,
      fontWeight: "800",
      lineHeight: 20
    }
  }), [colors, typography, spacing]);
}
