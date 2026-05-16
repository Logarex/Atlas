import { StoreCard } from "@/features/stores/StoreCard";
import { sampleStores } from "@/features/stores/sampleStores";
import { colors, spacing, typography } from "@/theme/tokens";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

export default function ExploreScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const stores = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sampleStores;
    return sampleStores.filter((store) => {
      const values = [
        store.name.en,
        store.name.fr,
        store.city,
        store.countryCode,
        store.status,
        store.architecture.era
      ];
      return values.some((value) => value.toLowerCase().includes(normalized));
    });
  }, [query]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t("home.kicker")}</Text>
        <Text style={styles.title}>{t("home.title")}</Text>
        <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
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
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={stores}
        keyExtractor={(store) => store.id}
        renderItem={({ item }) => <StoreCard store={item} />}
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
