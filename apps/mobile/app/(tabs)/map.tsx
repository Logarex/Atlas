import { getMarkerEmoji, getStoreName, getStorePlace, statusEmojis } from "@/features/stores/storeUtils";
import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { colors, spacing, typography } from "@/theme/tokens";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const { stores } = useStores();
  const { visits } = useLocalVisits();
  const visitedStoreIds = new Set(visits.map((visit) => visit.storeId));

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
        {stores.map((store) => (
          <Marker
            coordinate={store.coordinates}
            description={getStorePlace(store)}
            key={store.id}
            title={getStoreName(store, i18n.language)}
          >
            <View style={styles.marker}>
              <Text style={styles.markerText}>
                {visitedStoreIds.has(store.id) ? "✅" : getMarkerEmoji(store)}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.title}>{t("map.title")}</Text>
        <Text style={styles.copy}>
          {t("map.copy", { count: stores.length, visited: visitedStoreIds.size })}
        </Text>
        <View style={styles.legend}>
          {(["open", "closed", "relocated"] as const).map((status) => (
            <Text key={status} style={styles.legendItem}>
              {statusEmojis[status]} {t(`status.${status}`)}
            </Text>
          ))}
          <Text style={styles.legendItem}>✅ {t("map.visited")}</Text>
        </View>
        <View style={styles.row}>
          {stores.slice(0, 6).map((store) => (
            <Link
              href={{ pathname: "/store/[id]", params: { id: store.id } }}
              key={store.id}
              style={styles.link}
            >
              {getStoreName(store, i18n.language)}
            </Link>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  map: {
    ...StyleSheet.absoluteFill
  },
  panel: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    bottom: spacing.lg,
    left: spacing.lg,
    padding: spacing.md,
    position: "absolute",
    right: spacing.lg
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
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
    gap: spacing.sm,
    marginTop: spacing.md
  },
  legendItem: {
    color: colors.ink,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  link: {
    color: colors.teal,
    fontSize: typography.small,
    fontWeight: "700"
  },
  marker: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.ink,
    borderRadius: 18,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    shadowColor: colors.ink,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    width: 34
  },
  markerText: {
    fontSize: 18
  }
});
