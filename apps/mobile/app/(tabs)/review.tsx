import { createStore, updateStore } from "@/features/contributions/reviewApi";
import { useStores } from "@/features/stores/useStores";
import { StoreEditorModal } from "@/features/stores/StoreEditorModal";
import type { StoreRecord } from "@/features/stores/store.types";
import { useAppTheme } from "@/theme/useAppTheme";
import { MapPin, Plus, Edit2 } from "lucide-react-native";
import { useState, useMemo } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewScreen() {
  const theme = useAppTheme();
  const styles = useStyles(theme);
  
  // Live stores state
  const { stores, isLoading: loadingLive } = useStores();
  
  // Editor Modal state
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);

  async function handleSaveStore(storeData: StoreRecord) {
    try {
      if (editingStore) {
        await updateStore(storeData);
        Alert.alert("Success", "Store updated successfully");
      } else {
        await createStore(storeData);
        Alert.alert("Success", "Store created successfully");
      }
      setEditorVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save store");
    }
  }

  const renderLiveStore = ({ item }: { item: StoreRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.storeName}>{item.name.en}</Text>
          <Text style={styles.storePlace}>{item.city}, {item.countryCode}</Text>
        </View>
        <Pressable 
          onPress={() => {
            setEditingStore(item);
            setEditorVisible(true);
          }} 
          style={styles.iconButton}
        >
          <Edit2 color={theme.colors.copper} size={20} />
        </Pressable>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MapPin size={14} color={theme.colors.muted} />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage live stores and architectural data</Text>
      </View>

      {loadingLive ? (
        <View style={styles.centered}><ActivityIndicator color={theme.colors.copper} /></View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderLiveStore}
          ListEmptyComponent={<Text style={styles.emptyText}>No live stores found.</Text>}
        />
      )}
      
      <Pressable 
        style={styles.fab}
        onPress={() => {
          setEditingStore(null);
          setEditorVisible(true);
        }}
      >
        <Plus color={theme.colors.paper} size={24} />
      </Pressable>

      <StoreEditorModal 
        visible={editorVisible} 
        store={editingStore} 
        onClose={() => setEditorVisible(false)} 
        onSave={handleSaveStore} 
      />
    </SafeAreaView>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, radii, shadows, spacing, typography } = theme;

  return useMemo(() => StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg
    },
    header: {
      padding: spacing.lg,
      paddingBottom: spacing.md
    },
    title: {
      fontSize: typography.title1,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: -0.5
    },
    subtitle: {
      fontSize: typography.body,
      color: colors.muted,
      marginTop: spacing.xs,
      marginBottom: spacing.md
    },
    listContent: {
      padding: spacing.lg,
      gap: spacing.md
    },
    card: {
      backgroundColor: colors.paper,
      borderRadius: radii.md,
      padding: spacing.md,
      ...shadows.sm
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.sm
    },
    storeName: {
      fontSize: typography.title3,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: -0.5
    },
    storePlace: {
      fontSize: typography.small,
      color: colors.muted,
      fontWeight: "700",
      marginTop: 2
    },
    details: {
      gap: spacing.xs
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    detailText: {
      fontSize: typography.small,
      color: colors.muted,
      flex: 1
    },
    iconButton: {
      padding: spacing.xs,
      backgroundColor: colors.sky,
      borderRadius: radii.full
    },
    emptyText: {
      fontSize: typography.body,
      color: colors.muted,
      textAlign: "center"
    },
    fab: {
      position: "absolute",
      bottom: spacing.lg,
      right: spacing.lg,
      backgroundColor: colors.copper,
      width: 60,
      height: 60,
      borderRadius: radii.full,
      justifyContent: "center",
      alignItems: "center",
      ...shadows.md
    }
  }), [colors, radii, shadows, spacing, typography]);
}
