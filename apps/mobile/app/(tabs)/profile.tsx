import {
  submitStoreChange,
} from "@/features/contributions/contributionApi";
import {
  ensureCommunityProfile,
  getCurrentProfile,
  requestFriend,
  setPublicProfile,
  syncVisitsToCloud,
  type CommunityProfile
} from "@/features/social/socialApi";
import { getStoreName } from "@/features/stores/storeUtils";
import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAppTheme } from "@/theme/useAppTheme";
import { CalendarDays, Lock, Send, ShieldCheck, UsersRound, Key } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  
  const { stores } = useStores();
  const { visits } = useLocalVisits();
  
  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [username, setUsername] = useState("");
  const [friendUsername, setFriendUsername] = useState("");
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

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Check if user is actually logged in with email
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session?.user?.email);
    });

    void getCurrentProfile()
      .then((currentProfile) => {
        setProfile(currentProfile);
        setIsPublic(currentProfile?.publicProfile ?? false);
        setUsername(currentProfile?.username ?? "");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : null));
  }, []);

  async function handleLogin() {
    if (!supabase) return;
    try {
      setMessage("Connexion en cours...");
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      setIsLoggedIn(true);
      setMessage("Connecté avec succès. Rechargez l'application.");
      
      // Refresh profile
      const currentProfile = await getCurrentProfile();
      setProfile(currentProfile);
      setUsername(currentProfile?.username ?? "");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur de connexion");
    }
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setMessage("Déconnecté.");
  }

  async function handleCreateProfile() {
    try {
      setMessage(t("profile.saving"));
      const nextProfile = await ensureCommunityProfile(username);
      setProfile(nextProfile);
      setUsername(nextProfile.username);
      setIsPublic(nextProfile.publicProfile);
      setMessage(t("profile.profileReady"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
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

  async function handleSyncVisits() {
    try {
      setMessage(t("profile.syncing"));
      const count = await syncVisitsToCloud(visits);
      setMessage(t("profile.synced", { count }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
  }

  async function handleFriendRequest() {
    try {
      setMessage(t("profile.sendingFriend"));
      const friend = await requestFriend(friendUsername);
      setFriendUsername("");
      setMessage(t("profile.friendSent", { username: friend }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    }
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
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t("profile.kicker")}</Text>
          <Text style={styles.title}>{t("profile.title")}</Text>
          <Text style={styles.subtitle}>{t("profile.subtitle")}</Text>
        </View>

        {/* ADMIN LOGIN SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Key color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>Accès Sécurisé</Text>
          </View>
          {isLoggedIn ? (
            <>
              <Text style={styles.itemText}>Vous êtes connecté de manière sécurisée.</Text>
              <Pressable onPress={handleLogout} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Se déconnecter</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.itemText}>Connectez-vous avec votre mot de passe pour accéder à l'Admin Dashboard.</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                value={email}
              />
              <TextInput
                secureTextEntry
                onChangeText={setPassword}
                placeholder="Mot de passe"
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                value={password}
              />
              <Pressable
                disabled={!email || !password}
                onPress={handleLogin}
                style={[styles.primaryButton, { backgroundColor: theme.colors.copper }]}
              >
                <ShieldCheck color={theme.colors.paper} size={18} />
                <Text style={styles.primaryButtonText}>Se connecter</Text>
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
            <UsersRound color={theme.colors.moss} size={20} />
            <Text style={styles.statValue}>{profile ? `@${profile.username}` : "Local"}</Text>
            <Text style={styles.statLabel}>{t("profile.stats.identity")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UsersRound color={theme.colors.teal} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.community")}</Text>
          </View>
          <TextInput
            autoCapitalize="none"
            onChangeText={setUsername}
            placeholder={t("profile.usernamePlaceholder")}
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            value={username}
          />
          <Pressable
            disabled={!isSupabaseConfigured}
            onPress={handleCreateProfile}
            style={[styles.primaryButton, !isSupabaseConfigured && styles.disabledButton]}
          >
            <ShieldCheck color={theme.colors.paper} size={18} />
            <Text style={styles.primaryButtonText}>
              {profile ? t("profile.updateProfile") : t("profile.createProfile")}
            </Text>
          </Pressable>
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.itemTitle}>{t("profile.publicProfile")}</Text>
              <Text style={styles.itemText}>{t("profile.publicProfileCopy")}</Text>
            </View>
            <Switch disabled={!profile} value={isPublic} onValueChange={handleTogglePublic} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarDays color={theme.colors.teal} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.visits")}</Text>
          </View>
          <Pressable
            disabled={!isSupabaseConfigured || visits.length === 0}
            onPress={handleSyncVisits}
            style={[
              styles.secondaryButton,
              (!isSupabaseConfigured || visits.length === 0) && styles.disabledButton
            ]}
          >
            <Send color={theme.colors.teal} size={18} />
            <Text style={styles.secondaryButtonText}>{t("profile.syncVisits")}</Text>
          </Pressable>
          {recentVisits.length === 0 ? (
            <Text style={styles.itemText}>{t("profile.noVisits")}</Text>
          ) : (
            recentVisits.map((visit) => {
              const store = storeById.get(visit.storeId);
              return (
                <View key={visit.id} style={styles.visitRow}>
                  <Text style={styles.visitName}>
                    {store ? getStoreName(store, i18n.language) : visit.storeId}
                  </Text>
                  <Text style={styles.visitDate}>{visit.visitedOn}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UsersRound color={theme.colors.teal} size={22} />
            <Text style={styles.sectionTitle}>{t("profile.friends")}</Text>
          </View>
          <TextInput
            autoCapitalize="none"
            onChangeText={setFriendUsername}
            placeholder={t("profile.friendPlaceholder")}
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            value={friendUsername}
          />
          <Pressable
            disabled={!profile || friendUsername.trim().length === 0}
            onPress={handleFriendRequest}
            style={[
              styles.secondaryButton,
              (!profile || friendUsername.trim().length === 0) && styles.disabledButton
            ]}
          >
            <Send color={theme.colors.teal} size={18} />
            <Text style={styles.secondaryButtonText}>{t("profile.addFriend")}</Text>
          </Pressable>
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
      paddingBottom: spacing.xl
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
