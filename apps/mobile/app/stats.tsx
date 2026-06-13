import { useMemo, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, Modal, Animated, FlatList } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { BarChart2, ChevronLeft, Map, Compass, Trophy, X, Star } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import { useAppTheme } from "@/theme/useAppTheme";
import { useLocalVisits } from "@/features/visits/localVisits";
import { generatedStores } from "@/features/stores/generatedStores";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function StatsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { visits } = useLocalVisits();

  const [isGradeModalVisible, setIsGradeModalVisible] = useState(false);
  const [isStoresModalVisible, setIsStoresModalVisible] = useState(false);
  const [isCountriesModalVisible, setIsCountriesModalVisible] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const ranks = useMemo(() => [
    { id: "tourist", name: t("stats.grade.tourist", { defaultValue: "Touriste" }), max: 5 },
    { id: "explorer", name: t("stats.grade.explorer", { defaultValue: "Explorateur" }), max: 20 },
    { id: "citizen", name: t("stats.grade.citizen", { defaultValue: "Citoyen du Monde" }), max: 50 },
    { id: "legend", name: t("stats.grade.legend", { defaultValue: "Légende Vivante" }), max: null }
  ], [t]);

  const stats = useMemo(() => {
    const visitedStoreIds = new Set(visits.map(v => v.storeId));
    const storesByCountry: Record<string, number> = {};
    let totalVisited = 0;

    generatedStores.forEach(store => {
      if (visitedStoreIds.has(store.id)) {
        totalVisited++;
        // Use countryName instead of parsing the address
        const country = store.countryName || store.countryCode || "Unknown";
        storesByCountry[country] = (storesByCountry[country] || 0) + 1;
      }
    });

    const countriesCount = Object.keys(storesByCountry).length;
    
    let currentRankIndex = 0;
    if (totalVisited > 50) currentRankIndex = 3;
    else if (totalVisited > 20) currentRankIndex = 2;
    else if (totalVisited > 5) currentRankIndex = 1;

    const grade = ranks[currentRankIndex].name;
    const nextRank = currentRankIndex < 3 ? ranks[currentRankIndex + 1] : null;

    const allCountries = Object.entries(storesByCountry).sort((a, b) => b[1] - a[1]);

    const sortedCountries = allCountries.slice(0, 5);

    const chartData = {
      labels: sortedCountries.length ? sortedCountries.map(c => c[0].slice(0, 3).toUpperCase()) : ["-"],
      datasets: [
        {
          data: sortedCountries.length ? sortedCountries.map(c => c[1]) : [0]
        }
      ]
    };

    const visitedStoresList = visits.map(v => {
      const store = generatedStores.find(s => s.id === v.storeId);
      return { visit: v, store };
    }).filter(item => item.store).sort((a, b) => new Date(b.visit.visitedOn!).getTime() - new Date(a.visit.visitedOn!).getTime());

    return { totalVisited, countriesCount, grade, currentRankIndex, nextRank, chartData, allCountries, visitedStoresList };
  }, [visits, ranks]);

  useEffect(() => {
    if (isGradeModalVisible) {
      let percentage = 100;
      if (stats.nextRank) {
        const prevMax = stats.currentRankIndex > 0 ? ranks[stats.currentRankIndex - 1].max! : 0;
        const currentProgress = stats.totalVisited - prevMax;
        const totalNeeded = stats.nextRank.max! - prevMax;
        percentage = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));
      }
      
      Animated.timing(progressAnim, {
        toValue: percentage,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [isGradeModalVisible, stats.totalVisited, stats.nextRank, stats.currentRankIndex, ranks, progressAnim]);

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"]
  });

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: t("profile.stats.title", { defaultValue: "Vos Statistiques" }), headerShown: false }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing.lg }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroNavRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("store.back")}
            onPress={() => router.canGoBack() && router.back()}
            style={styles.compactBackButton}
          >
            <ChevronLeft color={theme.colors.ink} size={22} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <BarChart2 color={theme.colors.copper} size={32} />
          </View>
          <Text style={styles.title}>{t("profile.stats.title", { defaultValue: "Vos Statistiques" })}</Text>
        </View>

        <View style={styles.grid}>
          <Pressable 
            style={[styles.statCard, styles.gradeCard]} 
            onPress={() => setIsGradeModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t("stats.gradeHint", { defaultValue: "Appuyez pour voir les détails" })}
          >
            <View style={styles.gradeIconWrapper}>
              <Trophy color={theme.colors.paper} size={32} />
            </View>
            <View style={styles.gradeContent} accessible={true}>
              <Text style={styles.statLabelLight}>{t("stats.gradeLabel", { defaultValue: "Votre Grade" })}</Text>
              <Text style={styles.statValueLight}>{stats.grade}</Text>
              <Text style={styles.gradeHint}>{t("stats.gradeHint", { defaultValue: "Appuyez pour voir les détails" })}</Text>
            </View>
          </Pressable>
          
          <View style={styles.statRow}>
            <Pressable 
              style={[styles.statCard, { flex: 1 }]}
              onPress={() => setIsStoresModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t("stats.visitedStoresTitle", { defaultValue: "Boutiques visitées" })}
              accessible={true}
            >
              <View style={[styles.iconBox, { backgroundColor: `${theme.colors.teal}15` }]}>
                <Map color={theme.colors.teal} size={24} />
              </View>
              <Text style={styles.statValue}>{stats.totalVisited}</Text>
              <Text style={styles.statLabel}>{t("stats.visitedStores", { defaultValue: "Boutiques" })}</Text>
            </Pressable>
            <Pressable 
              style={[styles.statCard, { flex: 1 }]}
              onPress={() => setIsCountriesModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t("stats.exploredCountriesTitle", { defaultValue: "Pays explorés" })}
              accessible={true}
            >
              <View style={[styles.iconBox, { backgroundColor: `${theme.colors.mint}15` }]}>
                <Compass color={theme.colors.mint} size={24} />
              </View>
              <Text style={styles.statValue}>{stats.countriesCount}</Text>
              <Text style={styles.statLabel}>{t("stats.visitedCountries", { defaultValue: "Pays explorés" })}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>{t("stats.topCountries", { defaultValue: "Top 5 Pays" })}</Text>
          <BarChart
            data={stats.chartData}
            width={screenWidth - theme.spacing.lg * 4}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            chartConfig={{
              backgroundColor: theme.colors.paper,
              backgroundGradientFrom: theme.colors.paper,
              backgroundGradientTo: theme.colors.paper,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.colors.copper,
              labelColor: (opacity = 1) => theme.colors.muted,
              style: {
                borderRadius: 16
              },
              barPercentage: 0.6,
              fillShadowGradient: theme.colors.copper,
              fillShadowGradientOpacity: 1,
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </View>
      </ScrollView>

      {/* Modal for Grade Details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isGradeModalVisible}
        onRequestClose={() => setIsGradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + theme.spacing.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("stats.gradeDetails", { defaultValue: "Progression de Grade" })}</Text>
              <Pressable onPress={() => setIsGradeModalVisible(false)} style={styles.modalCloseButton}>
                <X color={theme.colors.ink} size={24} />
              </Pressable>
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                {stats.totalVisited} {t("stats.visitedCount", { defaultValue: "visites" })}
              </Text>
              
              <View style={styles.progressBarBackground}>
                <Animated.View style={[styles.progressBarFill, { width: widthInterpolated }]} />
              </View>

              <Text style={styles.progressNext}>
                {stats.nextRank 
                  ? t("stats.nextRankIn", { count: stats.nextRank.max! - stats.totalVisited, rank: stats.nextRank.name, defaultValue: `Encore ${stats.nextRank.max! - stats.totalVisited} pour le niveau ${stats.nextRank.name}` })
                  : t("stats.maxRankReched", { defaultValue: "Vous avez atteint le rang maximum !" })}
              </Text>
            </View>

            <View style={styles.ranksList}>
              {ranks.map((rank, index) => {
                const isCurrent = index === stats.currentRankIndex;
                const isReached = index <= stats.currentRankIndex;

                return (
                  <View key={rank.id} style={[styles.rankItem, isCurrent && styles.rankItemCurrent]}>
                    <View style={[styles.rankIconBox, isReached ? styles.rankIconBoxActive : styles.rankIconBoxInactive]}>
                      {isCurrent ? (
                        <Star color={theme.colors.paper} size={20} />
                      ) : (
                        <Trophy color={isReached ? theme.colors.copper : theme.colors.muted} size={20} />
                      )}
                    </View>
                    <View style={styles.rankInfo}>
                      <Text style={[styles.rankName, isCurrent && styles.rankNameCurrent]}>{rank.name}</Text>
                      <Text style={styles.rankTarget}>
                        {index === 0 ? "0+" : `${ranks[index - 1].max! + 1}+`} {t("stats.visitsAbbr", { defaultValue: "visites" })}
                      </Text>
                    </View>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>{t("stats.current", { defaultValue: "Actuel" })}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

          </View>
        </View>
      </Modal>

      {/* Modal for Visited Stores */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isStoresModalVisible}
        onRequestClose={() => setIsStoresModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.fullModalContent, { paddingBottom: insets.bottom + theme.spacing.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("stats.visitedStoresTitle", { defaultValue: "Boutiques visitées" })}</Text>
              <Pressable onPress={() => setIsStoresModalVisible(false)} style={styles.modalCloseButton} accessibilityRole="button" accessibilityLabel={t("stats.close", { defaultValue: "Fermer" })}>
                <X color={theme.colors.ink} size={24} />
              </Pressable>
            </View>
            <FlatList
              data={stats.visitedStoresList}
              keyExtractor={(item) => item.visit.id || item.store!.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{item.store?.name?.en || item.store?.id}</Text>
                  <Text style={styles.listItemSubtitle}>{item.visit.visitedOn}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal for Explored Countries */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCountriesModalVisible}
        onRequestClose={() => setIsCountriesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.fullModalContent, { paddingBottom: insets.bottom + theme.spacing.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("stats.exploredCountriesTitle", { defaultValue: "Pays explorés" })}</Text>
              <Pressable onPress={() => setIsCountriesModalVisible(false)} style={styles.modalCloseButton} accessibilityRole="button" accessibilityLabel={t("stats.close", { defaultValue: "Fermer" })}>
                <X color={theme.colors.ink} size={24} />
              </Pressable>
            </View>
            <FlatList
              data={stats.allCountries}
              keyExtractor={(item) => item[0]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{item[0]}</Text>
                  <Text style={styles.listItemSubtitle}>{item[1]} {t("stats.visitedCount", { defaultValue: "visites" })}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, typography, spacing, shadows, radii } = theme;
  return StyleSheet.create({
    screen: {
      backgroundColor: colors.canvas,
      flex: 1
    },
    content: {
      padding: spacing.lg
    },
    heroNavRow: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: spacing.md
    },
    compactBackButton: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: radii.full,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      width: 44,
      ...shadows.sm
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.xl
    },
    headerIconContainer: {
      backgroundColor: `${colors.copper}15`,
      padding: spacing.sm,
      borderRadius: radii.md,
    },
    title: {
      color: colors.ink,
      fontSize: 28,
      fontWeight: "900",
      letterSpacing: -0.5,
      lineHeight: 34
    },
    grid: {
      gap: spacing.md,
      marginBottom: spacing.xl
    },
    statRow: {
      flexDirection: "row",
      gap: spacing.md
    },
    statCard: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderWidth: 1,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      ...shadows.sm
    },
    gradeCard: {
      backgroundColor: colors.copper,
      borderColor: colors.copper,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      paddingVertical: spacing.xl,
    },
    gradeIconWrapper: {
      backgroundColor: "rgba(255,255,255,0.2)",
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    gradeContent: {
      flex: 1,
    },
    statValueLight: {
      fontSize: 24,
      fontWeight: "900",
      color: colors.paper,
      marginBottom: 2,
    },
    statLabelLight: {
      fontSize: typography.small,
      color: "rgba(255,255,255,0.8)",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    gradeHint: {
      fontSize: 12,
      color: "rgba(255,255,255,0.6)",
      fontWeight: "500",
      marginTop: spacing.xs,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: radii.md,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    statValue: {
      fontSize: 32,
      fontWeight: "900",
      color: colors.ink
    },
    statLabel: {
      fontSize: typography.body,
      color: colors.muted,
      fontWeight: "600"
    },
    chartSection: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderWidth: 1,
      borderRadius: radii.lg,
      padding: spacing.lg,
      ...shadows.sm
    },
    chartTitle: {
      fontSize: typography.title3,
      fontWeight: "800",
      color: colors.ink,
      marginBottom: spacing.lg
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalContent: {
      backgroundColor: colors.paper,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      ...shadows.md
    },
    fullModalContent: {
      flex: 0.85,
    },
    listItem: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    listItemTitle: {
      fontSize: typography.body,
      fontWeight: "700",
      color: colors.ink,
      marginBottom: spacing.xs,
    },
    listItemSubtitle: {
      fontSize: typography.small,
      color: colors.muted,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    modalTitle: {
      fontSize: typography.title2,
      fontWeight: "900",
      color: colors.ink,
    },
    modalCloseButton: {
      backgroundColor: colors.canvas,
      padding: spacing.sm,
      borderRadius: radii.full,
    },
    progressContainer: {
      backgroundColor: colors.canvas,
      padding: spacing.lg,
      borderRadius: radii.lg,
      marginBottom: spacing.xl,
    },
    progressLabel: {
      fontSize: typography.title3,
      fontWeight: "800",
      color: colors.ink,
      marginBottom: spacing.md,
    },
    progressBarBackground: {
      height: 12,
      backgroundColor: colors.line,
      borderRadius: 6,
      overflow: "hidden",
      marginBottom: spacing.sm,
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: colors.copper,
      borderRadius: 6,
    },
    progressNext: {
      fontSize: typography.small,
      color: colors.muted,
      fontWeight: "600",
      textAlign: "right",
    },
    ranksList: {
      gap: spacing.sm,
    },
    rankItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: "transparent",
    },
    rankItemCurrent: {
      backgroundColor: `${colors.copper}10`,
      borderColor: `${colors.copper}30`,
    },
    rankIconBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    rankIconBoxActive: {
      backgroundColor: `${colors.copper}20`,
    },
    rankIconBoxInactive: {
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.line,
    },
    rankInfo: {
      flex: 1,
    },
    rankName: {
      fontSize: typography.body,
      fontWeight: "700",
      color: colors.ink,
      marginBottom: 2,
    },
    rankNameCurrent: {
      color: colors.copper,
      fontWeight: "900",
    },
    rankTarget: {
      fontSize: typography.small,
      color: colors.muted,
      fontWeight: "500",
    },
    currentBadge: {
      backgroundColor: colors.copper,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.full,
    },
    currentBadgeText: {
      color: colors.paper,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
    }
  });
}
