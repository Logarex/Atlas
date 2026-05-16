import { sampleStores } from "@/features/stores/sampleStores";
import { colors, spacing, typography } from "@/theme/tokens";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function StoreDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = sampleStores.find((item) => item.id === id) ?? sampleStores[0];
  const name = i18n.language.startsWith("fr") ? store.name.fr : store.name.en;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: name }} />
      <Link href="/(tabs)" style={styles.back}>
        {t("store.back")}
      </Link>

      <Text style={styles.status}>{t(`status.${store.status}`)}</Text>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.location}>
        {store.city}, {store.countryCode}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("store.history")}</Text>
        <Text style={styles.body}>
          {t("store.openedOn", { date: store.openedOn })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("store.architecture")}</Text>
        <View style={styles.attributeGrid}>
          {Object.entries(store.architecture.attributes).map(([key, value]) => (
            <View key={key} style={styles.attribute}>
              <Text style={styles.attributeLabel}>{t(`attributes.${key}`)}</Text>
              <Text style={styles.attributeValue}>{t(`values.${value}`)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("store.sources")}</Text>
        {store.sources.map((source) => (
          <Text key={source.url} style={styles.source}>
            {source.label}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl
  },
  back: {
    color: colors.teal,
    fontSize: typography.small,
    fontWeight: "700",
    marginBottom: spacing.lg
  },
  status: {
    color: colors.copper,
    fontSize: typography.caption,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 41,
    marginTop: spacing.xs
  },
  location: {
    color: colors.muted,
    fontSize: typography.body,
    marginTop: spacing.sm
  },
  section: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    marginTop: spacing.xl,
    paddingTop: spacing.lg
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: spacing.sm
  },
  body: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23
  },
  attributeGrid: {
    gap: spacing.sm
  },
  attribute: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md
  },
  attributeLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.small
  },
  attributeValue: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800"
  },
  source: {
    color: colors.teal,
    fontSize: typography.small,
    lineHeight: 20
  }
});
