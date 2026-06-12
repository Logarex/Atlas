import { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Send, ChevronLeft } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import { useAppTheme } from "@/theme/useAppTheme";
import { submitStoreChange } from "@/features/contributions/contributionApi";

export default function ContributeScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreNote, setNewStoreNote] = useState("");
  const [newStoreContributorName, setNewStoreContributorName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  async function handleNewStoreProposal() {
    if (isSubmittingStore) return;
    try {
      setIsSubmittingStore(true);
      setMessage(t("profile.submittingStore"));
      await submitStoreChange({
        storeId: null,
        type: "new_store",
        proposedValue: newStoreName,
        note: newStoreNote,
        contributorName: newStoreContributorName
      });
      setNewStoreName("");
      setNewStoreNote("");
      setNewStoreContributorName("");
      setMessage(t("profile.storeSubmitted"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.failed"));
    } finally {
      setIsSubmittingStore(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: t("profile.newStore"), headerShown: false }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing.lg }
        ]}
      >
        <View style={styles.heroNavRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("store.back")}
            onPress={() => router.canGoBack() && router.back()}
            style={styles.compactBackButton}
          >
            <ChevronLeft color={theme.colors.ink} size={22} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Send color={theme.colors.copper} size={32} />
          <Text style={styles.title}>{t("profile.newStore")}</Text>
          <Text style={styles.subtitle}>
            {t("profile.newStoreHint", { defaultValue: "Proposez une boutique manquante à l'Atlas. Remplissez les informations ci-dessous et nous l'ajouterons après vérification." })}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            accessibilityLabel={t("profile.newStorePlaceholder")}
            onChangeText={setNewStoreName}
            placeholder={t("profile.newStorePlaceholder")}
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            value={newStoreName}
          />
          <TextInput
            accessibilityLabel={t("profile.newStoreNote")}
            multiline
            onChangeText={setNewStoreNote}
            placeholder={t("profile.newStoreNote")}
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, styles.textArea]}
            value={newStoreNote}
          />
          <TextInput
            accessibilityLabel={t("store.contributorNamePlaceholder")}
            onChangeText={setNewStoreContributorName}
            placeholder={t("store.contributorNamePlaceholder")}
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            value={newStoreContributorName}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: newStoreName.trim().length === 0 || isSubmittingStore }}
            accessibilityLabel={t("profile.submitStore")}
            disabled={newStoreName.trim().length === 0 || isSubmittingStore}
            onPress={handleNewStoreProposal}
            style={[
              styles.primaryButton,
              (newStoreName.trim().length === 0 || isSubmittingStore) && styles.disabledButton
            ]}
          >
            <Send color={theme.colors.paper} size={18} />
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.primaryButtonText}>{t("profile.submitStore")}</Text>
          </Pressable>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, typography, spacing, shadows } = theme;
  return useMemo(() => StyleSheet.create({
    screen: {
      backgroundColor: colors.canvas,
      flex: 1
    },
    content: {
      padding: spacing.lg
    },
    heroNavRow: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: spacing.md
    },
    compactBackButton: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      height: 40,
      justifyContent: "center",
      width: 40,
      ...shadows.sm
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xl
    },
    title: {
      color: colors.ink,
      fontSize: 30,
      fontWeight: "900",
      letterSpacing: 0,
      lineHeight: 36
    },
    subtitle: {
      color: colors.muted,
      fontSize: typography.body,
      lineHeight: 23
    },
    form: {
      gap: spacing.md
    },
    input: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.ink,
      fontSize: typography.body,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    textArea: {
      minHeight: 92,
      paddingTop: spacing.md,
      textAlignVertical: "top"
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: colors.copper,
      borderRadius: 8,
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: spacing.md,
      marginTop: spacing.md
    },
    primaryButtonText: {
      color: colors.paper,
      fontSize: typography.small,
      fontWeight: "900"
    },
    disabledButton: {
      opacity: 0.45
    },
    message: {
      color: colors.copper,
      fontSize: typography.small,
      fontWeight: "700",
      lineHeight: 20,
      marginTop: spacing.md,
      textAlign: "center"
    }
  }), [colors, typography, spacing, shadows]);
}
