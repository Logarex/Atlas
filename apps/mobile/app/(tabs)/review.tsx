import { getStoreCandidates, promoteStore, type StoreCandidate } from "@/features/contributions/reviewApi";
import { colors, spacing, typography } from "@/theme/tokens";
import { CheckCircle2, MapPin, ExternalLink, XCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewScreen() {
  const { t } = useTranslation();
  const [candidates, setCandidates] = useState<StoreCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    setLoading(true);
    try {
      const data = await getStoreCandidates();
      setCandidates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (candidates.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t("review.noCandidates")}</Text>
        <Pressable onPress={loadCandidates} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("review.title")}</Text>
        <Text style={styles.subtitle}>{t("review.subtitle")}</Text>
      </View>

      <FlatList
        data={candidates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.storeName}>{item.name.en}</Text>
                <Text style={styles.storePlace}>
                  {item.city}, {item.countryCode}
                </Text>
              </View>
              <Pressable 
                onPress={() => item.officialUrl && Linking.openURL(item.officialUrl)}
                style={styles.iconButton}
              >
                <ExternalLink color={colors.teal} size={20} />
              </Pressable>
            </View>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <MapPin size={14} color={colors.muted} />
                <Text style={styles.detailText}>{item.address}</Text>
              </View>
              {item.coordinates && (
                <Text style={styles.coords}>
                  {item.coordinates.latitude.toFixed(4)}, {item.coordinates.longitude.toFixed(4)}
                </Text>
              )}
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => handleSkip(item.id)}
                style={[styles.actionButton, styles.skipButton]}
              >
                <XCircle color={colors.danger} size={18} />
                <Text style={styles.skipButtonText}>{t("review.skip")}</Text>
              </Pressable>

              <Pressable
                onPress={() => handlePromote(item)}
                disabled={processingId === item.id}
                style={[styles.actionButton, styles.promoteButton]}
              >
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
        )}
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
    padding: spacing.lg
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.muted,
    marginTop: spacing.xs
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    padding: spacing.md,
    borderColor: colors.line,
    borderWidth: 1,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm
  },
  storeName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink
  },
  storePlace: {
    fontSize: typography.small,
    color: colors.teal,
    fontWeight: "600"
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
  coords: {
    fontSize: typography.caption,
    color: colors.muted,
    fontFamily: "System",
    opacity: 0.7
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
    height: 44,
    borderRadius: 8,
    borderWidth: 1
  },
  promoteButton: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  promoteButtonText: {
    color: colors.paper,
    fontWeight: "700",
    fontSize: typography.small
  },
  skipButton: {
    backgroundColor: colors.paper,
    borderColor: colors.line
  },
  skipButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: typography.small
  },
  iconButton: {
    padding: spacing.xs
  },
  emptyText: {
    fontSize: typography.body,
    color: colors.muted,
    textAlign: "center"
  },
  retryButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.canvas,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line
  },
  retryButtonText: {
    color: colors.teal,
    fontWeight: "700"
  }
});
