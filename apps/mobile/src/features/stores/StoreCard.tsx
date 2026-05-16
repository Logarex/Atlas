import type { StoreRecord } from "./store.types";

import { Link } from "expo-router";
import { CalendarDays, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme/tokens";

import {
  attributeEmojis,
  getPositiveAttributeKeys,
  getStoreName,
  getStorePlace,
  statusEmojis
} from "./storeUtils";

type StoreCardProps = {
  store: StoreRecord;
  isVisited?: boolean;
};

export function StoreCard({ isVisited = false, store }: StoreCardProps) {
  const { t, i18n } = useTranslation();
  const name = getStoreName(store, i18n.language);
  const featureKeys = getPositiveAttributeKeys(store).slice(0, 3);

  return (
    <Link href={{ pathname: "/store/[id]", params: { id: store.id } }} asChild>
      <Pressable style={styles.card}>
        <View style={styles.topLine}>
          <View style={styles.statusPill}>
            <Text style={styles.statusEmoji}>{statusEmojis[store.status]}</Text>
            <Text style={styles.status}>{t(`status.${store.status}`)}</Text>
          </View>
          <Text style={styles.country}>{isVisited ? t("store.visitedBadge") : store.countryCode}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.iconLine}>
          <MapPin color={colors.muted} size={15} />
          <Text style={styles.location}>{getStorePlace(store)}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t("store.era")}</Text>
            <Text style={styles.meta}>{store.architecture.era}</Text>
          </View>
          <View style={styles.metaItem}>
            <CalendarDays color={colors.moss} size={15} />
            <Text style={styles.meta}>
              {store.openedOn
                ? t("store.openedShort", { date: store.openedOn })
                : t("store.dateUnknown")}
            </Text>
          </View>
        </View>
        {featureKeys.length > 0 ? (
          <View style={styles.featureRow}>
            {featureKeys.map((key) => (
              <View key={key} style={styles.featurePill}>
                <Text style={styles.featureText}>
                  {attributeEmojis[key]} {t(`attributes.${key}`)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
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
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12
  },
  topLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  status: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  statusEmoji: {
    fontSize: typography.small
  },
  statusPill: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  country: {
    color: colors.teal,
    fontSize: typography.caption,
    fontWeight: "800"
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
    flex: 1,
    fontSize: typography.body,
    lineHeight: 21
  },
  iconLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
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
  metaItem: {
    flex: 1,
    gap: spacing.xs
  },
  metaLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  meta: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    lineHeight: 19
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  featurePill: {
    backgroundColor: colors.mint,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  featureText: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: "700"
  }
});
