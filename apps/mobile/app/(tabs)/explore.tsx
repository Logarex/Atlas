import { StoreCard } from "@/features/stores/StoreCard";
import { matchesStoreSearch, normalizeI18nKey } from "@/features/stores/storeUtils";
import type { ArchitectureAttribute, StoreRecord } from "@/features/stores/store.types";
import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { useAppTheme } from "@/theme/useAppTheme";
import {
  CalendarDays,
  Check,
  Globe2,
  Landmark,
  ListFilter,
  Map as MapIcon,
  Paintbrush,
  RotateCcw,
  Sparkles,
  X
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const filterKeys = ["all", "open", "closed", "visited"] as const;

const storeFeatureKeys: ArchitectureAttribute[] = [
  "avenue",
  "boardroom",
  "forum",
  "geniusBar",
  "greenWall",
  "pickup",
  "plaza",
  "trees",
  "videoWall"
];

const architecturalExtraKeys: ArchitectureAttribute[] = [
  "glassCube",
  "historicFacade",
  "outdoor"
];

const metadataExtraKeys = [
  "hasPhotos",
  "hasOfficialUrl",
  "hasCoordinates",
  "hasNotes"
] as const;

type AdvancedFilterGroup =
  | "countries"
  | "regions"
  | "years"
  | "designStyles"
  | "features"
  | "extras";

type AdvancedFilters = Record<AdvancedFilterGroup, string[]>;

type FilterOption = {
  count: number;
  label: string;
  value: string;
};

const advancedFilterGroupOrder: AdvancedFilterGroup[] = [
  "countries",
  "regions",
  "years",
  "designStyles",
  "features",
  "extras"
];

function createEmptyAdvancedFilters(): AdvancedFilters {
  return {
    countries: [],
    regions: [],
    years: [],
    designStyles: [],
    features: [],
    extras: []
  };
}

function addOption(
  options: Map<string, FilterOption>,
  value: string | null | undefined,
  label: string | null | undefined
) {
  const cleanValue = String(value ?? "").trim();
  const cleanLabel = String(label ?? "").trim();
  if (!cleanValue || !cleanLabel) return;

  const option = options.get(cleanValue);
  if (option) {
    option.count += 1;
    return;
  }

  options.set(cleanValue, {
    count: 1,
    label: cleanLabel,
    value: cleanValue
  });
}

function sortOptions(options: Map<string, FilterOption>, direction: "asc" | "desc" = "asc") {
  return [...options.values()].sort((a, b) => {
    const result = a.label.localeCompare(b.label, undefined, { numeric: true });
    return direction === "asc" ? result : -result;
  });
}

function regionFilterValue(store: StoreRecord) {
  return store.region ? `${store.countryCode}:${store.region}` : null;
}

function countryLabel(store: StoreRecord) {
  return store.countryName ? `${store.countryName} (${store.countryCode})` : store.countryCode;
}

function matchesDesignStyle(store: StoreRecord, value: string) {
  if (value.startsWith("era:")) {
    return store.architecture.era === value.slice(4);
  }

  if (value.startsWith("typology:")) {
    return store.architecture.typology === value.slice(9);
  }

  return false;
}

function matchesExtra(store: StoreRecord, value: string) {
  if ((architecturalExtraKeys as string[]).includes(value)) {
    return store.architecture.attributes[value as ArchitectureAttribute] === "yes";
  }

  switch (value) {
    case "hasPhotos":
      return Boolean(store.photos?.length);
    case "hasOfficialUrl":
      return Boolean(store.officialUrl);
    case "hasCoordinates":
      return Boolean(store.coordinates);
    case "hasNotes":
      return Boolean(store.architecture.notes?.length);
    default:
      return false;
  }
}

function matchesAdvancedFilters(store: StoreRecord, filters: AdvancedFilters) {
  if (filters.countries.length > 0 && !filters.countries.includes(store.countryCode)) {
    return false;
  }

  if (filters.regions.length > 0) {
    const regionValue = regionFilterValue(store);
    if (!regionValue || !filters.regions.includes(regionValue)) return false;
  }

  if (filters.years.length > 0) {
    const year = store.openedOn?.slice(0, 4);
    if (!year || !filters.years.includes(year)) return false;
  }

  if (
    filters.designStyles.length > 0 &&
    !filters.designStyles.some((value) => matchesDesignStyle(store, value))
  ) {
    return false;
  }

  if (
    filters.features.length > 0 &&
    !filters.features.every(
      (value) => store.architecture.attributes[value as ArchitectureAttribute] === "yes"
    )
  ) {
    return false;
  }

  if (
    filters.extras.length > 0 &&
    !filters.extras.every((value) => matchesExtra(store, value))
  ) {
    return false;
  }

  return true;
}

function getAdvancedFilterGroupIcon(group: AdvancedFilterGroup) {
  switch (group) {
    case "countries":
      return Globe2;
    case "regions":
      return MapIcon;
    case "years":
      return CalendarDays;
    case "designStyles":
      return Paintbrush;
    case "features":
      return Landmark;
    case "extras":
      return Sparkles;
  }
}

export default function ExploreScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles(theme);
  const reduceMotion = useReducedMotion();
  
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filterKeys)[number]>("all");
  const [advancedFilters, setAdvancedFilters] = useState(createEmptyAdvancedFilters);
  const [activeAdvancedFilterGroup, setActiveAdvancedFilterGroup] =
    useState<AdvancedFilterGroup>("countries");
  const [advancedFiltersVisible, setAdvancedFiltersVisible] = useState(false);
  const { error, isLoading, stores } = useStores();
  const { visits } = useLocalVisits();
  
  const visitsByStoreId = useMemo(() => {
    const groupedVisits = new Map<string, string[]>();

    for (const visit of visits) {
      const storeVisits = groupedVisits.get(visit.storeId) ?? [];
      storeVisits.push(visit.visitedOn);
      groupedVisits.set(visit.storeId, storeVisits);
    }

    return groupedVisits;
  }, [visits]);

  const visitedStoreIds = useMemo(
    () => new Set(visits.map((visit) => visit.storeId)),
    [visits]
  );

  const advancedFilterCount = useMemo(
    () => Object.values(advancedFilters).reduce((total, values) => total + values.length, 0),
    [advancedFilters]
  );

  const advancedOptions = useMemo(() => {
    const countries = new Map<string, FilterOption>();
    const regions = new Map<string, FilterOption>();
    const years = new Map<string, FilterOption>();
    const designStyles = new Map<string, FilterOption>();

    for (const store of stores) {
      addOption(countries, store.countryCode, countryLabel(store));
      addOption(
        regions,
        regionFilterValue(store),
        store.region ? `${store.region} (${store.countryCode})` : null
      );

      const year = store.openedOn?.slice(0, 4);
      addOption(years, year, year);

      addOption(
        designStyles,
        `era:${store.architecture.era}`,
        t("home.advancedFilters.eraValue", { value: t(`architectureDetails.eras.${normalizeI18nKey(store.architecture.era)}.title`, { defaultValue: store.architecture.era }) })
      );
      addOption(
        designStyles,
        store.architecture.typology ? `typology:${store.architecture.typology}` : null,
        store.architecture.typology
          ? t("home.advancedFilters.typologyValue", { value: t(`architectureDetails.typologies.${normalizeI18nKey(store.architecture.typology)}.title`, { defaultValue: store.architecture.typology }) })
          : null
      );
    }

    const countAttribute = (key: ArchitectureAttribute) =>
      stores.filter((store) => store.architecture.attributes[key] === "yes").length;
    const countExtra = (key: string) => stores.filter((store) => matchesExtra(store, key)).length;

    return {
      countries: sortOptions(countries),
      designStyles: sortOptions(designStyles),
      extras: [
        ...architecturalExtraKeys.map((key) => ({
          count: countAttribute(key),
          label: t(`attributes.${key}`),
          value: key
        })),
        ...metadataExtraKeys.map((key) => ({
          count: countExtra(key),
          label: t(`home.advancedFilters.extras.${key}`),
          value: key
        }))
      ].filter((option) => option.count > 0),
      features: storeFeatureKeys.map((key) => ({
        count: countAttribute(key),
        label: t(`attributes.${key}`),
        value: key
      })),
      regions: sortOptions(regions),
      years: sortOptions(years, "desc")
    };
  }, [stores, t]);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      if (filter === "open" && store.status !== "open") return false;
      if (filter === "closed" && store.status !== "closed") return false;
      if (filter === "visited" && !visitedStoreIds.has(store.id)) return false;
      if (!matchesAdvancedFilters(store, advancedFilters)) return false;
      return matchesStoreSearch(store, query);
    });
  }, [advancedFilters, filter, query, stores, visitedStoreIds]);

  function toggleAdvancedFilter(group: AdvancedFilterGroup, value: string) {
    setAdvancedFilters((currentFilters) => {
      const values = currentFilters[group];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return {
        ...currentFilters,
        [group]: nextValues
      };
    });
  }

  function renderFilterGroup(
    group: AdvancedFilterGroup,
    label: string,
    options: FilterOption[]
  ) {
    return (
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>{label}</Text>
        <View style={styles.filterChipGrid}>
          {options.map((option) => {
            const isSelected = advancedFilters[group].includes(option.value);

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${option.label}, ${option.count} results`}
                key={option.value}
                onPress={() => toggleAdvancedFilter(group, option.value)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                {isSelected ? (
                  <Check color={theme.colors.paper} size={13} />
                ) : null}
                <Text
                  numberOfLines={1}
                  style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[styles.filterChipCount, isSelected && styles.filterChipTextActive]}
                >
                  {option.count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderFilterGroupPicker() {
    return (
      <View style={styles.filterCategoryGrid}>
        {advancedFilterGroupOrder.map((group) => {
          const isActive = activeAdvancedFilterGroup === group;
          const selectedCount = advancedFilters[group].length;
          const optionsCount = advancedOptions[group].length;
          const Icon = getAdvancedFilterGroupIcon(group);

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${t(`home.advancedFilters.groups.${group}`)}, ${optionsCount} options${selectedCount > 0 ? `, ${selectedCount} selected` : ""}`}
              key={group}
              onPress={() => setActiveAdvancedFilterGroup(group)}
              style={[
                styles.filterCategoryButton,
                isActive && styles.filterCategoryButtonActive
              ]}
            >
              <View style={styles.filterCategoryTitleRow}>
                <Icon
                  color={isActive ? theme.colors.paper : theme.colors.copper}
                  size={17}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.filterCategoryTitle,
                    isActive && styles.filterCategoryTitleActive
                  ]}
                >
                  {t(`home.advancedFilters.groups.${group}`)}
                </Text>
              </View>
              <View style={styles.filterCategoryMetaRow}>
                <Text
                  style={[
                    styles.filterCategoryMeta,
                    isActive && styles.filterCategoryMetaActive
                  ]}
                >
                  {optionsCount}
                </Text>
                {selectedCount > 0 ? (
                  <View
                    style={[
                      styles.filterCategoryBadge,
                      isActive && styles.filterCategoryBadgeActive
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCategoryBadgeText,
                        isActive && styles.filterCategoryBadgeTextActive
                      ]}
                    >
                      {selectedCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("tabs.explore")}</Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchInputFrame}>
          <TextInput
            accessibilityRole="search"
            accessibilityLabel={t("home.searchLabel")}
            autoCapitalize="none"
            onChangeText={setQuery}
            placeholder={t("home.searchPlaceholder")}
            placeholderTextColor={theme.colors.muted}
            style={styles.searchInput}
            value={query}
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("home.clearSearch")}
              onPress={() => setQuery("")}
              style={styles.clearSearchButton}
            >
              <X color={theme.colors.muted} size={18} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filters}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: advancedFiltersVisible }}
            accessibilityLabel={advancedFilterCount > 0
              ? t("home.advancedFilters.activeButton", { count: advancedFilterCount })
              : t("home.advancedFilters.button")}
            onPress={() => setAdvancedFiltersVisible(true)}
            style={[
              styles.filterButton,
              advancedFilterCount > 0 && styles.advancedFilterButtonActive
            ]}
          >
            <ListFilter
              color={advancedFilterCount > 0 ? theme.colors.paper : theme.colors.copper}
              size={14}
            />
            <Text
              style={[
                styles.filterText,
                styles.advancedFilterText,
                advancedFilterCount > 0 && styles.advancedFilterTextActive
              ]}
            >
              {advancedFilterCount > 0
                ? t("home.advancedFilters.activeButton", { count: advancedFilterCount })
                : t("home.advancedFilters.button")}
            </Text>
          </Pressable>
          <View style={styles.filterDivider} />
          {filterKeys.map((key) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: filter === key }}
              accessibilityLabel={t(`home.filters.${key}`)}
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.filterButton, filter === key && styles.filterButtonActive]}
            >
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.filterText, filter === key && styles.filterTextActive]}
              >
                {t(`home.filters.${key}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {error ? <Text style={styles.warning}>{t("home.remoteError")}</Text> : null}
        {isLoading ? <Text style={styles.warning}>{t("home.loading")}</Text> : null}
        <Text style={styles.resultCount}>
          {t("home.resultCount", { count: filteredStores.length })}
        </Text>
      </View>

      <FlatList
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + theme.spacing.lg }
        ]}
        data={filteredStores}
        keyExtractor={(store) => store.id}
        renderItem={({ item }) => (
          <StoreCard
            isVisited={visitedStoreIds.has(item.id)}
            store={item}
            visitDates={visitsByStoreId.get(item.id) ?? []}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{t("home.empty")}</Text>
        }
      />

      <Modal
        animationType={reduceMotion ? "fade" : "slide"}
        onRequestClose={() => setAdvancedFiltersVisible(false)}
        visible={advancedFiltersVisible}
      >
        <SafeAreaView style={styles.modalScreen} edges={["left", "right", "bottom"]}>
          <View
            style={[
              styles.modalHeader,
              { paddingTop: insets.top + theme.spacing.xl }
            ]}
          >
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>{t("home.advancedFilters.title")}</Text>
              <Text style={styles.modalSubtitle}>
                {t("home.advancedFilters.subtitle")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("home.advancedFilters.close")}
              onPress={() => setAdvancedFiltersVisible(false)}
              style={styles.modalCloseButton}
            >
              <X color={theme.colors.ink} size={22} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {renderFilterGroupPicker()}
            {renderFilterGroup(
              activeAdvancedFilterGroup,
              t(`home.advancedFilters.groups.${activeAdvancedFilterGroup}`),
              advancedOptions[activeAdvancedFilterGroup]
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: advancedFilterCount === 0 }}
              accessibilityLabel={t("home.advancedFilters.reset")}
              disabled={advancedFilterCount === 0}
              onPress={() => setAdvancedFilters(createEmptyAdvancedFilters())}
              style={[
                styles.resetButton,
                advancedFilterCount === 0 && styles.disabledButton
              ]}
            >
              <RotateCcw color={theme.colors.copper} size={17} />
              <Text style={styles.resetButtonText}>
                {t("home.advancedFilters.reset")}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("home.advancedFilters.done")}
              onPress={() => setAdvancedFiltersVisible(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>
                {t("home.advancedFilters.done")}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
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
      letterSpacing: 0
    },
    searchWrap: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg
    },
    searchInputFrame: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderRadius: radii.md,
      flexDirection: "row",
      minHeight: 56,
      paddingLeft: spacing.lg,
      paddingRight: spacing.sm,
      ...shadows.md
    },
    searchInput: {
      color: colors.ink,
      flex: 1,
      fontSize: typography.body,
      height: "100%",
      paddingRight: spacing.sm
    },
    clearSearchButton: {
      alignItems: "center",
      borderRadius: radii.full,
      height: 36,
      justifyContent: "center",
      width: 36
    },
    filtersScroll: {
      marginTop: spacing.md,
      marginHorizontal: -spacing.lg,
    },
    filters: {
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      alignItems: "center"
    },
    filterDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.line,
      marginHorizontal: spacing.xs
    },
    filterButton: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderRadius: radii.full,
      flexDirection: "row",
      gap: spacing.xs,
      justifyContent: "center",
      minHeight: 38,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...shadows.sm
    },
    filterButtonActive: {
      backgroundColor: colors.ink
    },
    filterText: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800"
    },
    filterTextActive: {
      color: colors.paper
    },
    advancedFilterButtonActive: {
      backgroundColor: colors.copper,
      borderColor: colors.copper
    },
    advancedFilterText: {
      color: colors.copper,
    },
    advancedFilterTextActive: {
      color: colors.paper
    },

    warning: {
      color: colors.danger,
      fontSize: typography.caption,
      fontWeight: "700",
      marginTop: spacing.md
    },
    resultCount: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      marginTop: spacing.md
    },
    list: {
      gap: spacing.xxl,
      padding: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.lg
    },
    empty: {
      color: colors.muted,
      fontSize: typography.body,
      paddingTop: spacing.xxl,
      textAlign: "center"
    },
    modalScreen: {
      backgroundColor: colors.canvas,
      flex: 1
    },
    modalHeader: {
      alignItems: "center",
      borderBottomColor: colors.line,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      padding: spacing.lg
    },
    modalHeaderCopy: {
      flex: 1
    },
    modalTitle: {
      color: colors.ink,
      fontSize: typography.title2,
      fontWeight: "900"
    },
    modalSubtitle: {
      color: colors.muted,
      fontSize: typography.small,
      lineHeight: 20,
      marginTop: spacing.xs
    },
    modalCloseButton: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: radii.full,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42
    },
    modalContent: {
      gap: spacing.lg,
      padding: spacing.lg,
      paddingBottom: spacing.xxl
    },
    filterCategoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    filterCategoryButton: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexBasis: "48%",
      flexGrow: 1,
      gap: spacing.sm,
      justifyContent: "space-between",
      minHeight: 78,
      minWidth: 138,
      padding: spacing.md
    },
    filterCategoryButtonActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink
    },
    filterCategoryTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
      minWidth: 0
    },
    filterCategoryTitle: {
      color: colors.ink,
      flex: 1,
      fontSize: typography.small,
      fontWeight: "900"
    },
    filterCategoryTitleActive: {
      color: colors.paper
    },
    filterCategoryMetaRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between"
    },
    filterCategoryMeta: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "900"
    },
    filterCategoryMetaActive: {
      color: colors.sky
    },
    filterCategoryBadge: {
      alignItems: "center",
      backgroundColor: colors.mint,
      borderRadius: radii.full,
      minWidth: 24,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2
    },
    filterCategoryBadgeActive: {
      backgroundColor: colors.copper
    },
    filterCategoryBadgeText: {
      color: colors.ink,
      fontSize: typography.caption,
      fontWeight: "900"
    },
    filterCategoryBadgeTextActive: {
      color: colors.paper
    },
    filterGroup: {
      gap: spacing.sm
    },
    filterGroupTitle: {
      color: colors.ink,
      fontSize: typography.body,
      fontWeight: "900"
    },
    filterChipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    filterChip: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: radii.full,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      maxWidth: "100%",
      minHeight: 36,
      paddingHorizontal: spacing.md
    },
    filterChipActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink
    },
    filterChipText: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "800",
      maxWidth: 220
    },
    filterChipCount: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "900"
    },
    filterChipTextActive: {
      color: colors.paper
    },
    modalFooter: {
      backgroundColor: colors.paper,
      borderTopColor: colors.line,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.lg
    },
    resetButton: {
      alignItems: "center",
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      flex: 1,
      gap: spacing.sm,
      justifyContent: "center",
      minHeight: 48
    },
    resetButtonText: {
      color: colors.copper,
      fontSize: typography.small,
      fontWeight: "900"
    },
    doneButton: {
      alignItems: "center",
      backgroundColor: colors.ink,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 48
    },
    doneButtonText: {
      color: colors.paper,
      fontSize: typography.small,
      fontWeight: "900"
    },
    disabledButton: {
      opacity: 0.45
    }
  }), [colors, radii, shadows, spacing, typography]);
}
