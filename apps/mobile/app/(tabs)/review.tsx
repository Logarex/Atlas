import { getStoreCandidates, promoteStore, createStore, updateStore, type StoreCandidate } from "@/features/contributions/reviewApi";
import { useStores } from "@/features/stores/useStores";
import { StoreEditorModal } from "@/features/stores/StoreEditorModal";
import type { StoreRecord } from "@/features/stores/store.types";
import { colors, radii, shadows, spacing, typography } from "@/theme/tokens";
import { CheckCircle2, MapPin, ExternalLink, XCircle, Plus, Edit2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewScreen() {
  const { t } = useTranslation();
  const [candidates, setCandidates] = useState<StoreCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"candidates" | "live">("candidates");
  
  // Live stores state
  const { stores, isLoading: loadingLive, source } = useStores();
  
  // Editor Modal state
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    setLoadingCandidates(true);
    try {
      const data = await getStoreCandidates();
      setCandidates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCandidates(false);
    }
  }

  async function handlePromote(candidate: StoreCandidate) {
    setProcessingId(candidate.id);
    try {
      await promoteStore(candidate);
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
      Alert.alert(t("review.success"));
    } catch (e) {
      console.error(e);
      Alert.alert(t("review.error"));
    } finally {
      setProcessingId(null);
    }
  }

  function handleSkip(candidateId: string) {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
  }

  async function handleSaveStore(storeData: StoreRecord) {
    if (editingStore) {
      await updateStore(storeData);
      Alert.alert("Store updated successfully");
    } else {
      await createStore(storeData);
      Alert.alert("Store created successfully");
    }
    // Ideally we would trigger a refresh of useStores here
  }

  const renderCandidate = ({ item }: { item: StoreCandidate }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.storeName}>{item.name.en}</Text>
          <Text style={styles.storePlace}>{item.city}, {item.countryCode}</Text>
        </View>
        <Pressable onPress={() => item.officialUrl && Linking.openURL(item.officialUrl)} style={styles.iconButton}>
          <ExternalLink color={colors.copper} size={20} />
        </Pressable>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MapPin size={14} color={colors.muted} />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => handleSkip(item.id)} style={[styles.actionButton, styles.skipButton]}>
          <XCircle color={colors.danger} size={18} />
          <Text style={styles.skipButtonText}>{t("review.skip")}</Text>
        </Pressable>

        <Pressable onPress={() => handlePromote(item)} disabled={processingId === item.id} style={[styles.actionButton, styles.promoteButton]}>
          {processingId === item.id ? (
            <ActivityIndicator color={colors.paper} size="small" />
          ) : (
            <>
              <CheckCircle2 color={colors.paper} size={18} />
              <Text style={styles.promoteButtonText}>{t("review.promote")}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );

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
          <Edit2 color={colors.copper} size={20} />
        </Pressable>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MapPin size={14} color={colors.muted} />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage stores and pending imports</Text>
        
        <View style={styles.tabContainer}>
          <Pressable 
            style={[styles.tab, activeTab === "candidates" && styles.activeTab]}
            onPress={() => setActiveTab("candidates")}
          >
            <Text style={[styles.tabText, activeTab === "candidates" && styles.activeTabText]}>
              Candidates ({candidates.length})
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === "live" && styles.activeTab]}
            onPress={() => setActiveTab("live")}
          >
            <Text style={[styles.tabText, activeTab === "live" && styles.activeTabText]}>
              Live Stores
            </Text>
          </Pressable>
        </View>
      </View>

      {activeTab === "candidates" ? (
        loadingCandidates ? (
          <View style={styles.centered}><ActivityIndicator color={colors.copper} /></View>
        ) : candidates.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{t("review.noCandidates")}</Text>
            <Pressable onPress={loadCandidates} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Refresh</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={candidates}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderCandidate}
          />
        )
      ) : (
        <>
          {loadingLive ? (
            <View style={styles.centered}><ActivityIndicator color={colors.copper} /></View>
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
            <Plus color={colors.paper} size={24} />
          </Pressable>
        </>
      )}

      <StoreEditorModal 
        visible={editorVisible} 
        store={editingStore} 
        onClose={() => setEditorVisible(false)} 
        onSave={handleSaveStore} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 0
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.line,
    borderRadius: radii.full,
    padding: spacing.xs,
    marginBottom: spacing.md
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radii.full
  },
  activeTab: {
    backgroundColor: colors.paper,
    ...shadows.sm
  },
  tabText: {
    fontSize: typography.small,
    fontWeight: "700",
    color: colors.muted
  },
  activeTabText: {
    color: colors.ink
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
    gap: spacing.xs,
    marginBottom: spacing.md
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
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    height: 48,
    borderRadius: radii.full
  },
  promoteButton: {
    backgroundColor: colors.ink
  },
  promoteButtonText: {
    color: colors.paper,
    fontWeight: "800",
    fontSize: typography.small
  },
  skipButton: {
    backgroundColor: colors.sky
  },
  skipButtonText: {
    color: colors.danger,
    fontWeight: "800",
    fontSize: typography.small
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
  retryButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.paper,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.line
  },
  retryButtonText: {
    color: colors.ink,
    fontWeight: "800"
  },
  fab: {
    position: "absolute",
    bottom: spacing.xxl,
    right: spacing.lg,
    backgroundColor: colors.copper,
    width: 60,
    height: 60,
    borderRadius: radii.full,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.md
  }
});
