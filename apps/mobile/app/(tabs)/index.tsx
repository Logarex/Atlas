import { StoreCard } from "@/features/stores/StoreCard";
import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { colors, spacing, typography } from "@/theme/tokens";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

const filterKeys = ["all", "open", "closed", "visited"] as const;

export default function ExploreScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filterKeys)[number]>("all");
  const { error, isLoading, source, stores } = useStores();
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
        <Text style={styles.kicker}>{t("home.kicker")}</Text>
        <Text style={styles.title}>{t("home.title")}</Text>
        <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stores.length}</Text>
            <Text style={styles.statLabel}>
              {source === "supabase" ? t("home.liveDataset") : t("home.seedDataset")}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{visitedStoreIds.size}</Text>
            <Text style={styles.statLabel}>{t("home.visitedCount")}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          accessibilityLabel={t("home.searchLabel")}
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder={t("home.searchPlaceholder")}
          placeholderTextColor={colors.muted}
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

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md
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
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 39,
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
    marginTop: spacing.md
  },
  stat: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md
  },
  statValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900"
  },
  statLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    marginTop: spacing.xs,
    textTransform: "uppercase"
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm
  },
  searchInput: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    height: 48,
    paddingHorizontal: spacing.md
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  filterButton: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  filterButtonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
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
    color: colors.copper,
    fontSize: typography.caption,
    fontWeight: "700",
    marginTop: spacing.sm
  },
  list: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.sm
  },
  empty: {
    color: colors.muted,
    fontSize: typography.body,
    paddingTop: spacing.xl,
    textAlign: "center"
  }
});
