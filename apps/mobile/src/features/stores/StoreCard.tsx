import type { StoreRecord, StoreStatus } from "./store.types";

import { Link } from "expo-router";
import { CalendarDays, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";

import { useAppTheme } from "@/theme/useAppTheme";
import {
  attributeEmojis,
  getPositiveAttributeKeys,
  getStoreName,
  getStorePlace
} from "./storeUtils";

type StoreCardProps = {
  store: StoreRecord;
  isVisited?: boolean;
};

export function StoreCard({ isVisited = false, store }: StoreCardProps) {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  const name = getStoreName(store, i18n.language);
  const featureKeys = getPositiveAttributeKeys(store).slice(0, 3);

  const statusColors: Record<StoreStatus, string> = {
    open: theme.colors.teal,
    closed: theme.colors.ink,
    relocated: theme.colors.muted,
    announced: theme.colors.copper,
    temporary: theme.colors.gold
  };

  const statusColor = statusColors[store.status];

  return (
    <Link href={{ pathname: "/store/[id]", params: { id: store.id } }} asChild>
      <Pressable style={styles.card}>
        <View style={styles.topLine}>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.status}>{t(`status.${store.status}`)}</Text>
          </View>
          <Text style={styles.country}>{isVisited ? t("store.visitedBadge") : store.countryCode}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.iconLine}>
          <MapPin color={theme.colors.muted} size={15} />
          <Text style={styles.location}>{getStorePlace(store)}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t("store.era")}</Text>
            <Text style={styles.meta}>{store.architecture.era}</Text>
          </View>
          <View style={styles.metaItem}>
            <CalendarDays color={theme.colors.moss} size={15} />
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

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, radii, shadows, spacing, typography } = theme;
  
  return useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.paper,
      borderRadius: radii.md,
      padding: spacing.lg,
      ...shadows.md
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
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: radii.full
    },
    statusPill: {
      alignItems: "center",
      backgroundColor: colors.canvas,
      borderRadius: radii.full,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs
    },
    country: {
      color: colors.teal,
      fontSize: typography.small,
      fontWeight: "800"
    },
    name: {
      color: colors.ink,
      fontSize: typography.title2,
      fontWeight: "900",
      letterSpacing: -0.5,
      lineHeight: 28,
      marginTop: spacing.md
    },
    location: {
      color: colors.muted,
      flex: 1,
      fontSize: typography.body,
      lineHeight: 22
    },
    iconLine: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.sm
    },
    metaRow: {
      borderTopColor: colors.line,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.lg,
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
      borderRadius: radii.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs
    },
    featureText: {
      color: colors.ink,
      fontSize: typography.caption,
      fontWeight: "700"
    }
  }), [colors, radii, shadows, spacing, typography]);
}
