import React, { useState, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Modal, FlatList, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { getStoreName, getCityName } from "@/features/stores/storeUtils";
import { Footprints, TrainFront, MapPin, ChevronDown, ChevronLeft, X, Search } from "lucide-react-native";
import { useAppTheme } from "@/theme/useAppTheme";
import { useRomanizedNamesPreference } from "@/features/user/localUserData";

// @ts-ignore
import circuitsDataRaw from "@/features/circuit/circuitsData.json";

const circuitsData = circuitsDataRaw as Record<string, CircuitData>;

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface CircuitData {
  city: string;
  countryName: string;
  stores: {
    id: string;
    name: { en: string; fr?: string; es?: string; de?: string; it?: string; [key: string]: string | undefined };
    coordinates: Coordinate;
  }[];
  legs: {
    startStoreId: string;
    endStoreId: string;
    mode: string;
    duration: number;
    distance: number;
    polyline: string;
  }[];
  totalDuration: number;
  totalDistance: number;
}

function decodePolyline(t: string, precision = 5): Coordinate[] {
  if (!t) return [];
  let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision);
  while (index < t.length) {
    byte = null; shift = 0; result = 0;
    do { byte = t.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    shift = result = 0;
    do { byte = t.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += latitude_change; lng += longitude_change;
    coordinates.push({ latitude: lat / factor, longitude: lng / factor });
  }
  return coordinates;
}

const { width } = Dimensions.get("window");

export default function CircuitScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { preference: useRomanizedNames } = useRomanizedNamesPreference();

  const availableCities = useMemo(() => Object.keys(circuitsData).sort((a, b) => a.localeCompare(b)), []);
  const [selectedCity, setSelectedCity] = useState<string>(availableCities[0] || "");
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCities = useMemo(() => {
    if (!searchQuery) return availableCities;
    return availableCities.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [availableCities, searchQuery]);

  const circuit = selectedCity ? circuitsData[selectedCity] : null;

  const mapCoordinates = useMemo(() => {
    if (!circuit) return [];
    const points: Coordinate[] = [];
    circuit.stores.forEach(s => points.push(s.coordinates));
    circuit.legs.forEach(leg => {
      const decoded = decodePolyline(leg.polyline);
      if (decoded.length > 0) {
        points.push(...decoded);
      }
    });
    return points;
  }, [circuit]);

  // Fit map to coordinates when circuit changes
  React.useEffect(() => {
    if (mapRef.current && mapCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(mapCoordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [mapCoordinates]);

  if (!availableCities.length) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.errorText}>Aucun circuit disponible.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.title}>{t("circuit.title", { defaultValue: "Circuits" })}</Text>
        <Text style={styles.subtitle}>{t("circuit.description", { defaultValue: "Découvrez des itinéraires optimisés" })}</Text>
        
        <Pressable 
          style={styles.cityDropdownButton}
          onPress={() => setIsCityModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t("circuit.selectCity", { defaultValue: "Choisissez une ville" })}
        >
          <Text style={styles.cityDropdownText}>{getCityName(selectedCity, { romanized: useRomanizedNames })}</Text>
          <ChevronDown color={theme.colors.ink} size={20} />
        </Pressable>
      </View>

      {circuit && (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              userInterfaceStyle={theme.isDark ? "dark" : "light"}
              initialRegion={{
                latitude: circuit.stores[0].coordinates.latitude,
                longitude: circuit.stores[0].coordinates.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              {circuit.stores.map((store, index) => (
                <Marker key={store.id} coordinate={store.coordinates} zIndex={10}>
                  <View style={styles.markerContainer}>
                    <Text style={styles.markerText}>{index + 1}</Text>
                  </View>
                </Marker>
              ))}

              {circuit.legs.map((leg, index) => {
                const isTransit = leg.mode === "transit" || leg.mode === "TRANSIT";
                const strokeColor = isTransit ? theme.colors.copper : theme.colors.ink;
                let lineCoords = decodePolyline(leg.polyline);
                
                // Fallback if polyline is empty (e.g. MOCK mode)
                if (lineCoords.length === 0) {
                  const startStore = circuit.stores.find(s => s.id === leg.startStoreId);
                  const endStore = circuit.stores.find(s => s.id === leg.endStoreId);
                  if (startStore && endStore) {
                    lineCoords = [startStore.coordinates, endStore.coordinates];
                  }
                }

                return (
                  <Polyline
                    key={`leg-${index}`}
                    coordinates={lineCoords}
                    strokeColor={strokeColor}
                    strokeWidth={4}
                    lineDashPattern={isTransit ? [8, 4] : undefined}
                  />
                );
              })}
            </MapView>
            
            <View style={styles.statsOverlay}>
              <Text style={styles.statsText}>
                {Math.round(circuit.totalDuration / 60)} min • {(circuit.totalDistance / 1000).toFixed(1)} km
              </Text>
            </View>
          </View>

          <View style={styles.itineraryContainer} accessible={true}>
            {circuit.stores.map((store, index) => {
              const legToNext = circuit.legs.find(l => l.startStoreId === store.id);

              return (
                <View key={store.id} style={styles.itineraryStep} accessible={true}>
                  <View style={styles.stepLeft}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                    </View>
                    {index < circuit.stores.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.storeName}>{getStoreName(store, i18n.language, { romanized: useRomanizedNames })}</Text>
                    {legToNext && (
                      <View style={styles.legInfo}>
                        {legToNext.mode.toLowerCase() === "transit" ? (
                          <TrainFront color={theme.colors.copper} size={16} />
                        ) : (
                          <Footprints color={theme.colors.muted} size={16} />
                        )}
                        <Text style={styles.legText}>
                          {Math.round(legToNext.duration / 60)} min ({(legToNext.distance / 1000).toFixed(1)} km)
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isCityModalVisible}
        onRequestClose={() => {
          setIsCityModalVisible(false);
          setSearchQuery("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + theme.spacing.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("circuit.selectCity", { defaultValue: "Choisissez une ville" })}</Text>
              <Pressable onPress={() => {
                setIsCityModalVisible(false);
                setSearchQuery("");
              }} style={styles.modalCloseButton} accessibilityRole="button" accessibilityLabel={t("stats.close", { defaultValue: "Fermer" })}>
                <X color={theme.colors.ink} size={24} />
              </Pressable>
            </View>
            
            <View style={styles.searchContainer}>
              <Search color={theme.colors.muted} size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder={t("explore.searchPlaceholder", { defaultValue: "Rechercher..." })}
                placeholderTextColor={theme.colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} accessibilityRole="button" accessibilityLabel={t("stats.close", { defaultValue: "Effacer" })}>
                  <X color={theme.colors.muted} size={16} />
                </Pressable>
              )}
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.modalItem, selectedCity === item && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedCity(item);
                    setIsCityModalVisible(false);
                    setSearchQuery("");
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedCity === item }}
                >
                  <Text style={[styles.modalItemText, selectedCity === item && styles.modalItemTextActive]}>{getCityName(item, { romanized: useRomanizedNames })}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  return React.useMemo(() => StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.paper,
    },
    errorText: {
      color: theme.colors.muted,
      textAlign: "center",
      marginTop: 50,
      fontSize: theme.typography.body,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.title1,
      fontWeight: "800",
      color: theme.colors.ink,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.body,
      color: theme.colors.muted,
      marginBottom: theme.spacing.lg,
    },
    cityDropdownButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.canvas,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 14,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.line,
    },
    cityDropdownText: {
      fontSize: theme.typography.body,
      color: theme.colors.ink,
      fontWeight: "700",
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    mapContainer: {
      height: width * 0.8,
      width: "100%",
      position: "relative",
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    statsOverlay: {
      position: "absolute",
      bottom: theme.spacing.md,
      right: theme.spacing.md,
      backgroundColor: theme.colors.paper,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      borderRadius: theme.radii.full,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statsText: {
      fontSize: theme.typography.small,
      fontWeight: "700",
      color: theme.colors.ink,
    },
    markerContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.ink,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.colors.paper,
    },
    markerText: {
      color: theme.colors.paper,
      fontSize: 10,
      fontWeight: "800",
    },
    itineraryContainer: {
      padding: theme.spacing.lg,
    },
    itineraryStep: {
      flexDirection: "row",
    },
    stepLeft: {
      alignItems: "center",
      width: 30,
      marginRight: theme.spacing.md,
    },
    stepCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.canvas,
      borderWidth: 2,
      borderColor: theme.colors.ink,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    },
    stepNumber: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.colors.ink,
    },
    stepLine: {
      width: 2,
      flex: 1,
      backgroundColor: theme.colors.line,
      marginTop: -2,
      marginBottom: -2,
      zIndex: 1,
    },
    stepContent: {
      flex: 1,
      paddingBottom: theme.spacing.xl,
    },
    storeName: {
      fontSize: theme.typography.body,
      fontWeight: "700",
      color: theme.colors.ink,
      marginBottom: theme.spacing.xs,
    },
    legInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.canvas,
      padding: theme.spacing.sm,
      borderRadius: theme.radii.md,
    },
    legText: {
      fontSize: theme.typography.small,
      color: theme.colors.muted,
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      backgroundColor: theme.colors.paper,
      borderTopLeftRadius: theme.radii.lg,
      borderTopRightRadius: theme.radii.lg,
      maxHeight: "80%",
      paddingTop: theme.spacing.md,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.line,
    },
    modalTitle: {
      fontSize: theme.typography.title3,
      fontWeight: "800",
      color: theme.colors.ink,
    },
    modalCloseButton: {
      padding: theme.spacing.xs,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.canvas,
      marginHorizontal: theme.spacing.lg,
      marginVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.line,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: theme.spacing.sm,
      fontSize: theme.typography.body,
      color: theme.colors.ink,
    },
    modalItem: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.line,
    },
    modalItemActive: {
      backgroundColor: theme.colors.canvas,
    },
    modalItemText: {
      fontSize: theme.typography.body,
      color: theme.colors.ink,
      fontWeight: "500",
    },
    modalItemTextActive: {
      fontWeight: "800",
      color: theme.colors.copper,
    }
  }), [theme]);
}
