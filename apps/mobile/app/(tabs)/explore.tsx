import { StoreCard } from "@/features/stores/StoreCard";
import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { useAppTheme } from "@/theme/useAppTheme";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const filterKeys = ["all", "open", "closed", "visited"] as const;

export default function ExploreScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filterKeys)[number]>("all");
  const { error, isLoading, stores } = useStores();
  const { visits } = useLocalVisits();
  
  const visitedStoreIds = useMemo(
    () => new Set(visits.map((visit) => visit.storeId)),
    [visits]
  );

  const filteredStores = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return stores.filter((store) => {
      if (filter === "open" && store.status !== "open") return false;
      if (filter === "closed" && store.status !== "closed") return false;
      if (filter === "visited" && !visitedStoreIds.has(store.id)) return false;
      if (!normalized) return true;

      const values = [
        store.name.en,
        store.name.fr,
        store.city,
        store.region ?? "",
        store.countryCode,
        store.countryName ?? "",
        store.status,
        store.architecture.era,
        ...Object.keys(store.architecture.attributes)
      ];
      return values.some((value) => value.toLowerCase().includes(normalized));
    });
  }, [filter, query, stores, visitedStoreIds]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          accessibilityLabel={t("home.searchLabel")}
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder={t("home.searchPlaceholder")}
          placeholderTextColor={theme.colors.muted}
          style={styles.searchInput}
          value={query}
        />
        <View style={styles.filters}>
          {filterKeys.map((key) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.filterButton, filter === key && styles.filterButtonActive]}
            >
              <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
                {t(`home.filters.${key}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        {error ? <Text style={styles.warning}>{t("home.remoteError")}</Text> : null}
        {isLoading ? <Text style={styles.warning}>{t("home.loading")}</Text> : null}
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={filteredStores}
        keyExtractor={(store) => store.id}
        renderItem={({ item }) => (
          <StoreCard isVisited={visitedStoreIds.has(item.id)} store={item} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{t("home.empty")}</Text>
        }
      />
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
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md
    },
    title: {
      color: colors.ink,
      fontSize: typography.title1,
      fontWeight: "900",
      letterSpacing: -0.5
    },
    searchWrap: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    searchInput: {
      backgroundColor: colors.paper,
      borderRadius: radii.md,
      color: colors.ink,
      fontSize: typography.body,
      height: 56,
      paddingHorizontal: spacing.lg,
      ...shadows.md
    },
    filters: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.lg
    },
    filterButton: {
      backgroundColor: colors.paper,
      borderRadius: radii.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...shadows.sm
    },
    filterButtonActive: {
      backgroundColor: colors.ink,
    },
    filterText: {
      color: colors.muted,
      fontSize: typography.small,
      fontWeight: "800"
    },
    filterTextActive: {
      color: colors.paper
    },
    warning: {
      color: colors.danger,
      fontSize: typography.caption,
      fontWeight: "700",
      marginTop: spacing.md
    },
    list: {
      gap: spacing.xxl,
      padding: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxl
    },
    empty: {
      color: colors.muted,
      fontSize: typography.body,
      paddingTop: spacing.xxl,
      textAlign: "center"
    }
  }), [colors, radii, shadows, spacing, typography]);
}
