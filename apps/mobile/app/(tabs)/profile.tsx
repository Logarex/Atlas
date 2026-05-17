import {
  submitStoreChange,
} from "@/features/contributions/contributionApi";
import {
  ensureCommunityProfile,
  getCurrentProfile,
  setPublicProfile,
  type CommunityProfile
} from "@/features/social/socialApi";
import { getStoreName } from "@/features/stores/storeUtils";
import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { isSupabaseConfigured } from "@/lib/supabase";
import { deleteAccount, signInWithUsername, signOut, signUpWithUsername } from "@/features/auth/authApi";
import { useAppTheme } from "@/theme/useAppTheme";
import { CalendarDays, Lock, Send, ShieldCheck, Key, UserRound, Trash2, AlertTriangle, Palette, UserPlus } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  
  const { stores } = useStores();
  const { visits, clearAllVisits } = useLocalVisits();
  
  // Auth state
  const [authUsername, setAuthUsername] = useState("");
  const [code, setCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSource, setNewStoreSource] = useState("");
  const [newStoreNote, setNewStoreNote] = useState("");
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  
  const storeById = useMemo(
    () => new Map(stores.map((store) => [store.id, store])),
    [stores]
  );
  const visitedStoreIds = useMemo(
    () => new Set(visits.map((visit) => visit.storeId)),
    [visits]
  );
  const recentVisits = visits.slice(0, 4);
  const canUseAuth = isSupabaseConfigured
    && authUsername.trim().length >= 3
    && code.length >= 6
    && !isAuthLoading;

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    void getCurrentProfile()
      .then((currentProfile) => {
        setProfile(currentProfile);
        setIsLoggedIn(!!currentProfile);
        setIsPublic(currentProfile?.publicProfile ?? false);
        setAuthUsername(currentProfile?.username ?? "");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : null));
  }, []);

  async function handleLogin() {
    try {
      setIsAuthLoading(true);
      setMessage(t("profile.signingIn"));
      await signInWithUsername(authUsername, code);

      const currentProfile = await ensureCommunityProfile(authUsername);
      setProfile(currentProfile);
      setAuthUsername(currentProfile.username);
      setIsPublic(currentProfile.publicProfile);
      setIsLoggedIn(true);
      setMessage(t("profile.loginSuccess"));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur de connexion");
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function handleCreateAccount() {
    try {
      setIsAuthLoading(true);
      setMessage(t("profile.creatingAccount"));
      const authData = await signUpWithUsername(authUsername, code);

      if (!authData.session) {
        throw new Error(t("profile.confirmationRequired"));
      }

      const nextProfile = await ensureCommunityProfile(authUsername);
      setProfile(nextProfile);
      setAuthUsername(nextProfile.username);
      setIsPublic(nextProfile.publicProfile);
      setIsLoggedIn(true);
      setMessage(t("profile.accountCreated"));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t("profile.failed"));
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function handleLogout() {
    await signOut();
    setIsLoggedIn(false);
    setProfile(null);
    setCode("");
    setMessage(t("profile.loggedOut"));
  }

  async function handleTogglePublic(value: boolean) {
    setIsPublic(value);
    try {
      const nextProfile = await setPublicProfile(value);
      setProfile(nextProfile);
      setMessage(t("profile.privacySaved"));
    } catch (error) {
      setIsPublic(!value);
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
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
              // 1. Delete remote account if exists
              if (isLoggedIn) {
                await deleteAccount();
              }
              // 2. Clear local data
              await clearAllVisits();
              
              setIsLoggedIn(false);
              setProfile(null);
              setMessage("Toutes les données ont été supprimées.");
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
        sourceUrl: newStoreSource,
        note: newStoreNote
      });
      setNewStoreName("");
      setNewStoreSource("");
      setNewStoreNote("");
      setMessage(t("profile.storeSubmitted"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t("profile.kicker")}</Text>
          <Text style={styles.title}>{t("profile.title")}</Text>
          <Text style={styles.subtitle}>{t("profile.subtitle")}</Text>
        </View>

        {/* AUTH SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Key color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.secureAccess")}</Text>
          </View>
          {isLoggedIn ? (
            <>
              <Text style={styles.itemText}>{t("profile.connectedSecurely")}</Text>
              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.itemTitle}>{t("profile.publicProfile")}</Text>
                  <Text style={styles.itemText}>{t("profile.publicProfileCopy")}</Text>
                </View>
                <Switch disabled={!profile} value={isPublic} onValueChange={handleTogglePublic} />
              </View>
              <Pressable onPress={handleLogout} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t("profile.logout")}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.itemText}>{t("profile.loginCopy")}</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setAuthUsername}
                placeholder={t("profile.username")}
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                value={authUsername}
              />
              <TextInput
                secureTextEntry
                onChangeText={setCode}
                placeholder={t("profile.code")}
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                value={code}
              />
              <Pressable
                disabled={!canUseAuth}
                onPress={handleLogin}
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.colors.copper },
                  !canUseAuth && styles.disabledButton
                ]}
              >
                <ShieldCheck color={theme.colors.paper} size={18} />
                <Text style={styles.primaryButtonText}>{t("profile.login")}</Text>
              </Pressable>
              <Pressable
                disabled={!canUseAuth}
                onPress={handleCreateAccount}
                style={[
                  styles.secondaryButton,
                  !canUseAuth && styles.disabledButton
                ]}
              >
                <UserPlus color={theme.colors.teal} size={18} />
                <Text style={styles.secondaryButtonText}>{t("profile.createAccount")}</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <CalendarDays color={theme.colors.teal} size={20} />
            <Text style={styles.statValue}>{visitedStoreIds.size}</Text>
            <Text style={styles.statLabel}>{t("profile.stats.visited")}</Text>
          </View>
          <View style={styles.stat}>
            <UserRound color={theme.colors.moss} size={20} />
            <Text style={styles.statValue}>{profile ? `@${profile.username}` : "Local"}</Text>
            <Text style={styles.statLabel}>{t("profile.stats.identity")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarDays color={theme.colors.teal} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.visits")}</Text>
          </View>
          {recentVisits.length === 0 ? (
            <Text style={styles.itemText}>{t("profile.noVisits")}</Text>
          ) : (
            recentVisits.map((visit) => {
              const store = storeById.get(visit.storeId);
              return (
                <View key={visit.id} style={styles.visitRow}>
                  <Text style={styles.visitName}>
                    {store ? getStoreName(store, i18n.language, { noLocal: true }) : visit.storeId}
                  </Text>
                  <Text style={styles.visitDate}>{visit.visitedOn}</Text>
                </View>
              );
            })
          )}
        </View>



        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Send color={theme.colors.teal} size={22} />
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
            autoCapitalize="none"
            onChangeText={setNewStoreSource}
            placeholder={t("profile.newStoreSource")}
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            value={newStoreSource}
          />
          <TextInput
            multiline
            onChangeText={setNewStoreNote}
            placeholder={t("profile.newStoreNote")}
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, styles.textArea]}
            value={newStoreNote}
          />
          <Pressable
            disabled={!isSupabaseConfigured || newStoreName.trim().length === 0}
            onPress={handleNewStoreProposal}
            style={[
              styles.secondaryButton,
              (!isSupabaseConfigured || newStoreName.trim().length === 0) && styles.disabledButton
            ]}
          >
            <Send color={theme.colors.teal} size={18} />
            <Text style={styles.secondaryButtonText}>{t("profile.submitStore")}</Text>
          </Pressable>
        </View>

        {/* THEME SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette color={theme.colors.teal} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.theme.title")}</Text>
          </View>
          <Text style={styles.itemText}>{t("profile.theme.copy")}</Text>
          
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
            <Lock color={theme.colors.teal} size={22} />
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
    statsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md // Correction de la marge ici pour détacher de la section Admin
    },
    stat: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      gap: spacing.xs,
      padding: spacing.md
    },
    statValue: {
      color: colors.ink,
      fontSize: 20,
      fontWeight: "900"
    },
    statLabel: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      textTransform: "uppercase"
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
    primaryButton: {
      alignItems: "center",
      backgroundColor: colors.ink,
      borderRadius: 8,
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: spacing.md
    },
    primaryButtonText: {
      color: colors.paper,
      fontSize: typography.small,
      fontWeight: "900"
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
    secondaryButtonText: {
      color: colors.teal,
      fontSize: typography.small,
      fontWeight: "900"
    },
    disabledButton: {
      opacity: 0.45
    },
    switchRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between"
    },
    switchCopy: {
      flex: 1
    },
    visitRow: {
      alignItems: "center",
      borderTopColor: colors.line,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
      paddingTop: spacing.sm
    },
    visitName: {
      color: colors.ink,
      flex: 1,
      fontSize: typography.small,
      fontWeight: "800"
    },
    visitDate: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800"
    },
    privacyRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.sm
    },
    privacyIcon: {
      color: colors.teal,
      fontSize: typography.body,
      fontWeight: "900"
    },
    themeSelectorRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs
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
    }
  }), [colors, typography, spacing]);
}
