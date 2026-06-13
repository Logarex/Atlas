import { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Image as ImageIcon } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { useAppTheme } from "@/theme/useAppTheme";
import { useLocalUserPhotos } from "@/features/user/localUserData";
import { generatedStores } from "@/features/stores/generatedStores";
import { useRomanizedNamesPreference } from "@/features/user/localUserData";
import { getStoreName } from "@/features/stores/storeUtils";

const { width } = Dimensions.get("window");
const numColumns = 3;
const imageSize = (width - 32 - (numColumns - 1) * 8) / numColumns;

export default function GalleryScreen() {
  const { t, i18n } = useTranslation();
  const { preference: useRomanizedNames } = useRomanizedNamesPreference();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { photos } = useLocalUserPhotos();

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [photos]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: t("gallery.title", { defaultValue: "Galerie" }), headerShown: false }} />
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("store.back")}
          onPress={() => router.canGoBack() && router.back()}
          style={styles.compactBackButton}
        >
          <ChevronLeft color={theme.colors.ink} size={22} />
        </Pressable>
        <Text style={styles.title}>{t("gallery.title", { defaultValue: "Galerie de Visites" })}</Text>
      </View>

      {sortedPhotos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ImageIcon color={theme.colors.muted} size={48} />
          <Text style={styles.emptyText}>{t("gallery.empty", { defaultValue: "Aucune photo n'a encore été ajoutée à vos visites." })}</Text>
        </View>
      ) : (
        <FlatList
          data={sortedPhotos}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + theme.spacing.lg }]}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            const store = generatedStores.find(s => s.id === item.storeId);
            const storeName = store ? getStoreName(store, i18n.language, { romanized: useRomanizedNames }) : "";
            return (
              <View style={styles.photoContainer}>
                <ExpoImage
                  source={{ uri: item.uri }}
                  style={styles.photo}
                  contentFit="cover"
                />
                {store && (
                  <View style={styles.overlay}>
                    <Text style={styles.storeName} numberOfLines={1}>{storeName}</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.md
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
    title: {
      color: colors.ink,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: 0,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      padding: spacing.xl
    },
    emptyText: {
      fontSize: typography.body,
      color: colors.muted,
      textAlign: "center"
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: 8
    },
    row: {
      gap: 8
    },
    photoContainer: {
      width: imageSize,
      height: imageSize,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: colors.line
    },
    photo: {
      flex: 1,
      width: "100%",
      height: "100%"
    },
    overlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: 4
    },
    storeName: {
      color: colors.paper,
      fontSize: 10,
      fontWeight: "700"
    }
  }), [colors, typography, spacing, shadows]);
}
