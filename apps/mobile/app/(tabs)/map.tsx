import { sampleStores } from "@/features/stores/sampleStores";
import { colors, spacing, typography } from "@/theme/tokens";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function MapScreen() {
  const { t } = useTranslation();

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
        {sampleStores.map((store) => (
          <Marker
            coordinate={store.coordinates}
            description={`${store.city}, ${store.countryCode}`}
            key={store.id}
            title={store.name.en}
          />
        ))}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.title}>{t("map.title")}</Text>
        <Text style={styles.copy}>{t("map.copy")}</Text>
        <View style={styles.row}>
          {sampleStores.map((store) => (
            <Link
              href={{ pathname: "/store/[id]", params: { id: store.id } }}
              key={store.id}
              style={styles.link}
            >
              {store.name.en}
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
  }
});
