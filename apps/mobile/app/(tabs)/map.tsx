import { getStoreName, getStorePlace } from "@/features/stores/storeUtils";
import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { useAppTheme } from "@/theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Check, X, ArrowRight, CalendarDays, Store } from "lucide-react-native";
import MapView, { Marker } from "react-native-maps";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useState } from "react";
import type { StoreStatus } from "@/features/stores/store.types";
import type { LayoutChangeEvent } from "react-native";

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useStyles(theme);
  const [mapSize, setMapSize] = useState({ height: 0, width: 0 });
  
  const { stores } = useStores();
  const { visits } = useLocalVisits();
  const visitedStoreIds = new Set(visits.map((visit) => visit.storeId));
  const geocodedStores = stores.filter((store) => store.coordinates);
  const canRenderMap = mapSize.height > 0 && mapSize.width > 0;

  function handleMapLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    if (height <= 0 || width <= 0) return;

    setMapSize((currentSize) => {
      if (currentSize.height === height && currentSize.width === width) {
        return currentSize;
      }

      return { height, width };
    });
  }

  const statusColors: Record<StoreStatus, string> = {
    open: theme.colors.teal,
    closed: theme.colors.ink,
    relocated: theme.colors.muted,
    announced: theme.colors.gold,
    temporary: theme.colors.moss
  };

  const StatusIcon = ({ status, isVisited, color, size = 12 }: { status: StoreStatus; isVisited: boolean; color: string; size?: number }) => {
    if (isVisited) return <Check color={color} size={size} strokeWidth={3} />;
    switch (status) {
      case "open": return null; // Default circle
      case "closed": return <X color={color} size={size} strokeWidth={3} />;
      case "relocated": return <ArrowRight color={color} size={size} strokeWidth={3} />;
      case "announced": return <CalendarDays color={color} size={size} strokeWidth={3} />;
      case "temporary": return <Store color={color} size={size} strokeWidth={3} />;
      default: return null;
    }
  };

  const visitedPinColor = theme.colors.copper;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View onLayout={handleMapLayout} style={styles.mapContainer}>
        {canRenderMap ? (
          <MapView
            initialRegion={{
              latitude: 30,
              longitude: 0,
              latitudeDelta: 120,
              longitudeDelta: 120
            }}
            style={[styles.map, mapSize]}
          >
            {geocodedStores.map((store) => {
              const isVisited = visitedStoreIds.has(store.id);
              const pinColor = isVisited ? visitedPinColor : statusColors[store.status];
              const coordinate = store.coordinates!;

              return (
                  <Marker
                    coordinate={coordinate}
                    description={getStorePlace(store)}
                    key={store.id}
                    onPress={() => router.push({ pathname: "/store/[id]", params: { id: store.id } })}
                    title={getStoreName(store, i18n.language)}
                    accessible={true}
                    accessibilityLabel={`${getStoreName(store, i18n.language)}, ${t(`status.${store.status}`)}${isVisited ? `, ${t("map.visited")}` : ""}`}
                  >
                    <View style={[styles.marker, { borderColor: isVisited ? theme.colors.paper : pinColor }]}>
                      <View style={[styles.markerInner, { backgroundColor: pinColor }]}>
                        <StatusIcon status={store.status} isVisited={isVisited} color={theme.colors.paper} size={10} />
                      </View>
                    </View>
                  </Marker>
              );
            })}
          </MapView>
        ) : null}
      </View>

      <View style={[styles.panel, { bottom: insets.bottom + theme.spacing.md }]}>
        <Text style={styles.title}>{t("map.title")}</Text>

        <View style={styles.legend}>
          {(["open", "closed", "relocated"] as const).map((status) => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: statusColors[status] }]}>
                <StatusIcon status={status} isVisited={false} color={theme.colors.paper} size={10} />
              </View>
              <Text style={styles.legendText}>{t(`status.${status}`)}</Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: visitedPinColor }]}>
              <StatusIcon status="open" isVisited={true} color={theme.colors.paper} size={10} />
            </View>
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
    mapContainer: {
      ...StyleSheet.absoluteFillObject
    },
    map: {
      flex: 1
    },
    panel: {
      backgroundColor: colors.paper,
      borderRadius: radii.md,
      bottom: spacing.md,
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
      letterSpacing: 0
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
      width: 16,
      height: 16,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center"
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
      alignItems: "center",
      borderRadius: 9,
      height: 18,
      justifyContent: "center",
      width: 18
    }
  }), [colors, radii, shadows, spacing, typography]);
}
