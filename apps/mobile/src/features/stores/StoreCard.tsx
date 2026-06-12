import type { StoreRecord, StoreStatus } from "./store.types";

import { Link } from "expo-router";
import { MapPin, CalendarDays, Palette } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useMemo } from "react";

import { useAppTheme } from "@/theme/useAppTheme";
import {
  getPhotoSource,
  getPhotoThumbUrl,
  getStoreName,
  getStorePlace,
  normalizeI18nKey
} from "./storeUtils";

type StoreCardProps = {
  store: StoreRecord;
  isVisited?: boolean;
  visitDates?: string[];
};

export function StoreCard({ isVisited = false, store, visitDates = [] }: StoreCardProps) {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  const name = getStoreName(store, i18n.language);
  const coverPhoto = store.photos?.[0];
  const architecture = store.architecture.typology ?? store.architecture.era;
  const year = store.openedOn?.slice(0, 4);

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
      <Pressable accessibilityRole="button" style={styles.card}>
        {coverPhoto ? (
          <Image
            source={getPhotoSource(getPhotoThumbUrl(coverPhoto))}
            style={styles.coverImage}
          />
        ) : null}
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
          <Text style={styles.location} numberOfLines={1}>{getStorePlace(store)}</Text>
        </View>
        <View style={styles.detailsRow}>
          {architecture ? (
            <View style={styles.detailPill}>
              <Palette color={theme.colors.copper} size={12} />
              <Text style={styles.detailText} numberOfLines={1}>
                {t(`architectureDetails.${store.architecture.typology ? "typologies" : "eras"}.${normalizeI18nKey(architecture)}.title`, { defaultValue: architecture })}
              </Text>
            </View>
          ) : null}
          {year ? (
            <View style={styles.detailPill}>
              <CalendarDays color={theme.colors.copper} size={12} />
              <Text style={styles.detailText}>{year}</Text>
            </View>
          ) : null}
        </View>
        {visitDates.length > 0 ? (
          <View style={styles.personalHistory}>
            <Text style={styles.personalHistoryLabel}>{t("store.personalHistory")}</Text>
            <Text style={styles.personalHistoryDates} numberOfLines={2}>
              {visitDates.join(" · ")}
            </Text>
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
    coverImage: {
      backgroundColor: colors.line,
      borderRadius: 8,
      height: 148,
      marginBottom: spacing.md,
      resizeMode: "cover",
      width: "100%"
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
      color: colors.copper,
      fontSize: typography.small,
      fontWeight: "800"
    },
    name: {
      color: colors.ink,
      fontSize: typography.title2,
      fontWeight: "900",
      letterSpacing: 0,
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
    detailsRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.sm
    },
    detailPill: {
      alignItems: "center",
      backgroundColor: colors.canvas,
      borderRadius: radii.full,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4
    },
    detailText: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase"
    },
    personalHistory: {
      backgroundColor: colors.canvas,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      gap: spacing.xs,
      marginTop: spacing.md,
      padding: spacing.md
    },
    personalHistoryLabel: {
      color: colors.copper,
      fontSize: typography.caption,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    personalHistoryDates: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "800",
      lineHeight: 19
    }
  }), [colors, radii, shadows, spacing, typography]);
}
