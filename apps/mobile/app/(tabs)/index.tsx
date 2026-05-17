import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { useAppTheme } from "@/theme/useAppTheme";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo } from "react";
import { Map, Search, Compass, Clock, Info, History } from "lucide-react-native";
import { getStoreName } from "@/features/stores/storeUtils";

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  
  const { stats, stores } = useStores();
  const { visits } = useLocalVisits();
  
  const visitedStoreIds = useMemo(
    () => new Set(visits.map((visit) => visit.storeId)),
    [visits]
  );

  const totalStores = stores.length > 0 ? stores.length : 1;
  const progressPercent = Math.min(100, Math.round((visitedStoreIds.size / totalStores) * 100));

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t("home.kicker")}</Text>
          <Text style={styles.title}>{t("home.title")}</Text>
          <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>{stats.open}</Text>
              <Text style={styles.statLabel}>{t("home.stats.open")}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>{stats.closed}</Text>
              <Text style={styles.statLabel}>{t("home.stats.closed")}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>{stats.relocated}</Text>
              <Text style={styles.statLabel}>{t("home.stats.relocated")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Compass color={theme.colors.teal} size={22} />
            <Text style={styles.sectionTitle}>Ma Progression</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Apple Stores visités</Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        {visits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <History color={theme.colors.teal} size={22} />
              <Text style={styles.sectionTitle}>{t("home.recentVisits")}</Text>
            </View>
            <View style={styles.recentGrid}>
              {visits.slice(0, 3).map((visit) => {
                const store = stores.find(s => s.id === visit.storeId);
                return (
                  <Link key={visit.id} href={`/store/${visit.storeId}`} asChild>
                    <Pressable style={styles.recentCard}>
                      <Clock size={16} color={theme.colors.muted} />
                      <View style={styles.recentCardBody}>
                        <Text style={styles.recentName} numberOfLines={1}>
                          {store ? getStoreName(store, t("lang"), { noLocal: true }) : visit.storeId}
                        </Text>
                        <Text style={styles.recentDate}>{visit.visitedOn}</Text>
                      </View>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accès Rapide</Text>
          <View style={styles.quickLinks}>
            <Link href="/explore" asChild>
              <Pressable style={styles.quickLinkButton}>
                <Search color={theme.colors.paper} size={20} />
                <Text style={styles.quickLinkText}>Rechercher une boutique</Text>
              </Pressable>
            </Link>
            <Link href="/map" asChild>
              <Pressable style={StyleSheet.flatten([styles.quickLinkButton, { backgroundColor: theme.colors.copper }])}>
                <Map color={theme.colors.paper} size={20} />
                <Text style={styles.quickLinkText}>Ouvrir la carte mondiale</Text>
              </Pressable>
            </Link>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, radii, shadows, spacing, typography } = theme;

  return useMemo(() => StyleSheet.create({
    screen: {
      backgroundColor: colors.canvas,
      flex: 1
    },
    content: {
      paddingBottom: spacing.lg
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.md
    },
    kicker: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    title: {
      color: colors.ink,
      fontSize: 40,
      fontWeight: "900",
      letterSpacing: -1,
      lineHeight: 44,
      marginTop: spacing.xs
    },
    subtitle: {
      color: colors.muted,
      fontSize: typography.title3,
      lineHeight: 28,
      marginTop: spacing.md
    },
    statsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xl
    },
    stat: {
      backgroundColor: colors.paper,
      borderRadius: radii.md,
      flex: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      ...shadows.sm
    },
    statValue: {
      color: colors.ink,
      fontSize: typography.title1,
      fontWeight: "900"
    },
    statLabel: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      marginTop: spacing.sm,
      textTransform: "uppercase"
    },
    section: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xl
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.md
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: typography.title2,
      fontWeight: "900",
      letterSpacing: -0.5,
      marginBottom: spacing.sm
    },
    progressContainer: {
      backgroundColor: colors.paper,
      borderRadius: radii.lg,
      padding: spacing.lg,
      ...shadows.sm
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: spacing.sm
    },
    progressLabel: {
      color: colors.ink,
      fontSize: typography.body,
      fontWeight: "800"
    },
    progressPercent: {
      color: colors.teal,
      fontSize: typography.title2,
      fontWeight: "900"
    },
    progressBarBg: {
      height: 12,
      backgroundColor: colors.canvas,
      borderRadius: radii.full,
      overflow: "hidden"
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: colors.teal,
      borderRadius: radii.full
    },
    progressHint: {
      color: colors.muted,
      fontSize: typography.small,
      marginTop: spacing.md,
      lineHeight: 20
    },
    quickLinks: {
      gap: spacing.md,
      marginTop: spacing.xs
    },
    quickLinkButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.ink,
      padding: spacing.lg,
      borderRadius: radii.lg,
      gap: spacing.md,
      ...shadows.sm
    },
    quickLinkText: {
      color: colors.paper,
      fontSize: typography.body,
      fontWeight: "800"
    },
    recentGrid: {
      gap: spacing.sm
    },
    recentCard: {
      backgroundColor: colors.paper,
      borderRadius: radii.md,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      ...shadows.sm
    },
    recentCardBody: {
      flex: 1
    },
    recentName: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "800"
    },
    recentDate: {
      color: colors.muted,
      fontSize: typography.caption,
      marginTop: 2
    }
  }), [colors, radii, shadows, spacing, typography]);
}
