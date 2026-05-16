import type { StoreRecord } from "./store.types";

import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme/tokens";

type StoreCardProps = {
  store: StoreRecord;
};

export function StoreCard({ store }: StoreCardProps) {
  const { t, i18n } = useTranslation();
  const name = i18n.language.startsWith("fr") ? store.name.fr : store.name.en;

  return (
    <Link href={{ pathname: "/store/[id]", params: { id: store.id } }} asChild>
      <Pressable style={styles.card}>
        <View style={styles.topLine}>
          <Text style={styles.status}>{t(`status.${store.status}`)}</Text>
          <Text style={styles.country}>{store.countryCode}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.location}>{store.city}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{store.architecture.era}</Text>
          <Text style={styles.meta}>{t("store.openedShort", { date: store.openedOn })}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  topLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  status: {
    color: colors.copper,
    fontSize: typography.caption,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  country: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  name: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 27,
    marginTop: spacing.sm
  },
  location: {
    color: colors.muted,
    fontSize: typography.body,
    marginTop: spacing.xs
  },
  metaRow: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md
  },
  meta: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small
  }
});
