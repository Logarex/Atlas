import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { useAppTheme } from "@/theme/useAppTheme";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo } from "react";
import { CalendarDays, Clock, Compass } from "lucide-react-native";
import { getStoreName } from "@/features/stores/storeUtils";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles(theme);

  const { stats, stores } = useStores();
  const { visits } = useLocalVisits();

  const storeById = useMemo(
    () => new Map(stores.map((store) => [store.id, store])),
    [stores]
  );
  const visitedStoreIds = useMemo(
    () => new Set(visits.map((visit) => visit.storeId)),
    [visits]
  );
  const totalStores = stores.length > 0 ? stores.length : 1;
  const progressPercent = Math.min(100, Math.round((visitedStoreIds.size / totalStores) * 100));

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing.lg }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerTopLine}>
            <Text style={styles.kicker}>{t("home.kicker")}</Text>
            <View style={styles.progressPill}>
              <Compass color={theme.colors.teal} size={15} />
              <Text style={styles.progressPillText}>{progressPercent}%</Text>
            </View>
          </View>
          <Text style={styles.title}>{t("home.title")}</Text>
          <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <View style={styles.statAccent} />
              <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>{stats.open}</Text>
              <Text style={styles.statLabel}>{t("home.stats.open")}</Text>
            </View>
            <View style={styles.stat}>
              <View style={styles.statAccent} />
              <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>{stats.closed}</Text>
              <Text style={styles.statLabel}>{t("home.stats.closed")}</Text>
            </View>
            <View style={styles.stat}>
              <View style={styles.statAccent} />
              <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>{stats.relocated}</Text>
              <Text style={styles.statLabel}>{t("home.stats.relocated")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Compass color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>{t("home.progressTitle")}</Text>
          </View>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressCopy}>
                <Text style={styles.progressLabel}>{t("home.progressLabel")}</Text>
                <Text style={styles.progressCount}>
                  {t("home.progressCount", {
                    total: stores.length,
                    visited: visitedStoreIds.size
                  })}
                </Text>
              </View>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarDays color={theme.colors.copper} size={22} />
            <Text style={styles.sectionTitle}>{t("home.visits")}</Text>
          </View>
          {visits.length === 0 ? (
            <View style={styles.emptyVisitsCard}>
              <Text style={styles.emptyVisitsText}>{t("home.noVisits")}</Text>
            </View>
          ) : (
            <View style={styles.visitList}>
              {visits.map((visit) => {
                const store = storeById.get(visit.storeId);
                return (
                  <Link key={visit.id} href={`/store/${visit.storeId}`} asChild>
                    <Pressable style={styles.visitCard}>
                      <View style={styles.visitIcon}>
                        <Clock size={16} color={theme.colors.copper} />
                      </View>
                      <View style={styles.visitCardBody}>
                        <View style={styles.visitTopLine}>
                          <Text style={styles.visitName} numberOfLines={1}>
                            {store ? getStoreName(store, i18n.language, { noLocal: true }) : visit.storeId}
                          </Text>
                          <Text style={styles.visitDate}>{visit.visitedOn}</Text>
                        </View>
                        {visit.note ? (
                          <Text style={styles.visitNote} numberOfLines={3}>{visit.note}</Text>
                        ) : null}
                      </View>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          )}
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
      paddingTop: spacing.xl,
      paddingBottom: spacing.md
    },
    headerTopLine: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.sm
    },
    kicker: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    progressPill: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      minHeight: 32,
      paddingHorizontal: spacing.sm
    },
    progressPillText: {
      color: colors.ink,
      fontSize: typography.caption,
      fontWeight: "900"
    },
    title: {
      color: colors.ink,
      fontSize: 36,
      fontWeight: "900",
      letterSpacing: 0,
      lineHeight: 39
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
      marginTop: spacing.lg
    },
    stat: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      minHeight: 96,
      overflow: "hidden",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      ...shadows.sm
    },
    statAccent: {
      backgroundColor: colors.copper,
      height: 3,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0
    },
    statValue: {
      color: colors.ink,
      fontSize: 29,
      fontWeight: "900",
      lineHeight: 32
    },
    statLabel: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      lineHeight: 15,
      marginTop: spacing.xs,
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
      letterSpacing: 0,
      marginBottom: spacing.sm
    },
    progressCard: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      padding: spacing.md,
      ...shadows.sm
    },
    progressHeader: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between"
    },
    progressCopy: {
      flex: 1,
      gap: spacing.xs
    },
    progressLabel: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      textTransform: "uppercase"
    },
    progressCount: {
      color: colors.ink,
      fontSize: typography.body,
      fontWeight: "900"
    },
    progressPercent: {
      color: colors.copper,
      fontSize: typography.title1,
      fontWeight: "900",
      lineHeight: 34
    },
    progressBarBg: {
      backgroundColor: colors.canvas,
      borderRadius: 999,
      height: 12,
      marginTop: spacing.md,
      overflow: "hidden"
    },
    progressBarFill: {
      backgroundColor: colors.copper,
      borderRadius: 999,
      height: "100%"
    },
    visitList: {
      gap: spacing.sm
    },
    emptyVisitsCard: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: radii.md,
      borderWidth: 1,
      padding: spacing.md,
      ...shadows.sm
    },
    emptyVisitsText: {
      color: colors.muted,
      fontSize: typography.small,
      lineHeight: 20
    },
    visitCard: {
      alignItems: "flex-start",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.md,
      ...shadows.sm
    },
    visitIcon: {
      alignItems: "center",
      backgroundColor: colors.sky,
      borderRadius: radii.full,
      height: 34,
      justifyContent: "center",
      width: 34
    },
    visitCardBody: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0
    },
    visitTopLine: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between"
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
      fontWeight: "800",
      marginTop: 2
    },
    visitNote: {
      color: colors.muted,
      fontSize: typography.small,
      lineHeight: 20
    }
  }), [colors, radii, shadows, spacing, typography]);
}
