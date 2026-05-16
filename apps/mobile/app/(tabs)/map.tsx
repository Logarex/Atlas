import { getStoreName, getStorePlace } from "@/features/stores/storeUtils";
import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { useAppTheme } from "@/theme/useAppTheme";
import { useTranslation } from "react-i18next";
import MapView, { Marker } from "react-native-maps";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo } from "react";
import type { StoreStatus } from "@/features/stores/store.types";

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  
  const { stores } = useStores();
  const { visits } = useLocalVisits();
  const visitedStoreIds = new Set(visits.map((visit) => visit.storeId));

  const statusColors: Record<StoreStatus, string> = {
    open: theme.colors.teal,
    closed: theme.colors.ink,
    relocated: theme.colors.muted,
    announced: theme.colors.copper,
    temporary: theme.colors.gold
  };

  return (
    <SafeAreaView style={styles.screen}>
      <MapView
        initialRegion={{
          latitude: 30,
          longitude: 0,
          latitudeDelta: 120,
          longitudeDelta: 120
        }}
        style={styles.map}
      >
        {stores.map((store) => {
          const isVisited = visitedStoreIds.has(store.id);
          const pinColor = isVisited ? theme.colors.moss : statusColors[store.status];
          
          return (
            <Marker
              coordinate={store.coordinates}
              description={getStorePlace(store)}
              key={store.id}
              title={getStoreName(store, i18n.language)}
            >
              <View style={[styles.marker, { borderColor: isVisited ? theme.colors.paper : pinColor }]}>
                <View style={[styles.markerInner, { backgroundColor: pinColor }]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.title}>Carte mondiale</Text>
        <Text style={styles.copy}>
          {stores.length} boutiques chargées, {visitedStoreIds.size} marquées comme vues sur cet appareil.
        </Text>
        <View style={styles.legend}>
          {(["open", "closed", "relocated"] as const).map((status) => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: statusColors[status] }]} />
              <Text style={styles.legendText}>{t(`status.${status}`)}</Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.moss }]} />
            <Text style={styles.legendText}>{t("map.visited")}</Text>
          </View>
        </View>
      </View>
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
    map: {
      ...StyleSheet.absoluteFillObject
    },
    panel: {
      backgroundColor: colors.paper,
      borderRadius: radii.md,
      bottom: spacing.lg,
      left: spacing.lg,
      padding: spacing.lg,
      position: "absolute",
      right: spacing.lg,
      ...shadows.md
    },
    title: {
      color: colors.ink,
      fontSize: typography.title3,
      fontWeight: "900",
      letterSpacing: -0.5
    },
    copy: {
      color: colors.muted,
      fontSize: typography.small,
      lineHeight: 20,
      marginTop: spacing.xs
    },
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      marginTop: spacing.md
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: radii.full
    },
    legendText: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "700"
    },
    marker: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderRadius: 16,
      borderWidth: 2,
      height: 24,
      justifyContent: "center",
      width: 24,
      ...shadows.sm
    },
    markerInner: {
      borderRadius: 8,
      height: 14,
      width: 14
    }
  }), [colors, radii, shadows, spacing, typography]);
}
