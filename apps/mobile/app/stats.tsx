import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { BarChart2, ChevronLeft, Map, Compass, Trophy } from "lucide-react-native";
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

  const stats = useMemo(() => {
    const visitedStoreIds = new Set(visits.map(v => v.storeId));
    const storesByCountry: Record<string, number> = {};
    let totalVisited = 0;

    generatedStores.forEach(store => {
      if (visitedStoreIds.has(store.id)) {
        totalVisited++;
        // extracting country from address, basic heuristic: last part of address
        const parts = store.address.split(",");
        const country = parts[parts.length - 1]?.trim() || "Unknown";
        storesByCountry[country] = (storesByCountry[country] || 0) + 1;
      }
    });

    const countriesCount = Object.keys(storesByCountry).length;
    
    let grade = t("stats.grade.tourist", { defaultValue: "Touriste" });
    if (totalVisited > 50) grade = t("stats.grade.legend", { defaultValue: "Légende Vivante" });
    else if (totalVisited > 20) grade = t("stats.grade.citizen", { defaultValue: "Citoyen du Monde" });
    else if (totalVisited > 5) grade = t("stats.grade.explorer", { defaultValue: "Explorateur" });

    // sort countries by count
    const sortedCountries = Object.entries(storesByCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const chartData = {
      labels: sortedCountries.length ? sortedCountries.map(c => c[0].slice(0, 3).toUpperCase()) : ["-"],
      datasets: [
        {
          data: sortedCountries.length ? sortedCountries.map(c => c[1]) : [0]
        }
      ]
    };

    return { totalVisited, countriesCount, grade, chartData };
  }, [visits, t]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: t("profile.stats.title", { defaultValue: "Vos Statistiques" }), headerShown: false }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing.lg }
        ]}
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
          <BarChart2 color={theme.colors.copper} size={32} />
          <Text style={styles.title}>{t("profile.stats.title", { defaultValue: "Vos Statistiques" })}</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Trophy color={theme.colors.copper} size={24} />
            <Text style={styles.statValue}>{stats.grade}</Text>
            <Text style={styles.statLabel}>{t("stats.gradeLabel", { defaultValue: "Votre Grade" })}</Text>
          </View>
          
          <View style={styles.statRow}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Map color={theme.colors.teal} size={24} />
              <Text style={styles.statValue}>{stats.totalVisited}</Text>
              <Text style={styles.statLabel}>{t("stats.visitedStores", { defaultValue: "Boutiques visitées" })}</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Compass color={theme.colors.mint} size={24} />
              <Text style={styles.statValue}>{stats.countriesCount}</Text>
              <Text style={styles.statLabel}>{t("stats.visitedCountries", { defaultValue: "Pays explorés" })}</Text>
            </View>
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
            chartConfig={{
              backgroundColor: theme.colors.paper,
              backgroundGradientFrom: theme.colors.paper,
              backgroundGradientTo: theme.colors.paper,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(215, 122, 97, ${opacity})`,
              labelColor: (opacity = 1) => theme.colors.muted,
              style: {
                borderRadius: 16
              },
              barPercentage: 0.6,
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </View>
      </ScrollView>
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
      borderRadius: 8,
      borderWidth: 1,
      height: 40,
      justifyContent: "center",
      width: 40,
      ...shadows.sm
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xl
    },
    title: {
      color: colors.ink,
      fontSize: 30,
      fontWeight: "900",
      letterSpacing: 0,
      lineHeight: 36
    },
    grid: {
      gap: spacing.sm,
      marginBottom: spacing.xl
    },
    statRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    statCard: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderWidth: 1,
      borderRadius: radii.md,
      padding: spacing.lg,
      gap: spacing.sm,
      ...shadows.sm
    },
    statValue: {
      fontSize: 24,
      fontWeight: "900",
      color: colors.ink
    },
    statLabel: {
      fontSize: typography.small,
      color: colors.muted,
      fontWeight: "600"
    },
    chartSection: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderWidth: 1,
      borderRadius: radii.md,
      padding: spacing.lg,
      ...shadows.sm
    },
    chartTitle: {
      fontSize: typography.body,
      fontWeight: "800",
      color: colors.ink,
      marginBottom: spacing.md
    }
  });
}
