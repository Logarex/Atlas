import { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ChevronLeft, QrCode, ScanLine, Share2 } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAppTheme } from "@/theme/useAppTheme";
import { useLocalVisits } from "@/features/visits/localVisits";

export default function P2PCompareScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { visits } = useLocalVisits();

  const [activeTab, setActiveTab] = useState<"share" | "scan">("share");
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const qrData = useMemo(() => {
    const ids = Array.from(new Set(visits.map(v => v.storeId))).join(",");
    return `atlas:v1:${ids}`;
  }, [visits]);

  const handleScan = ({ data }: { data: string }) => {
    if (data.startsWith("atlas:v1:")) {
      setScannedData(data);
    }
  };

  const myVisitsCount = new Set(visits.map(v => v.storeId)).size;
  const scannedVisitsCount = scannedData ? scannedData.replace("atlas:v1:", "").split(",").filter(Boolean).length : 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: t("p2p.title", { defaultValue: "Comparaison" }), headerShown: false }} />
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("store.back")}
          onPress={() => router.canGoBack() && router.back()}
          style={styles.compactBackButton}
        >
          <ChevronLeft color={theme.colors.ink} size={22} />
        </Pressable>
        <View style={styles.tabs}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveTab("share")}
            style={[styles.tab, activeTab === "share" && styles.activeTab]}
          >
            <QrCode color={activeTab === "share" ? theme.colors.paper : theme.colors.muted} size={18} />
            <Text style={[styles.tabText, activeTab === "share" && styles.activeTabText]}>
              {t("p2p.share", { defaultValue: "Partager" })}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (!permission?.granted) requestPermission();
              setActiveTab("scan");
            }}
            style={[styles.tab, activeTab === "scan" && styles.activeTab]}
          >
            <ScanLine color={activeTab === "scan" ? theme.colors.paper : theme.colors.muted} size={18} />
            <Text style={[styles.tabText, activeTab === "scan" && styles.activeTabText]}>
              {t("p2p.scan", { defaultValue: "Scanner" })}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
        {activeTab === "share" ? (
          <View style={styles.shareSection}>
            <Text style={styles.title}>{t("p2p.myCode", { defaultValue: "Mon QR Code" })}</Text>
            <Text style={styles.subtitle}>
              {t("p2p.shareDesc", { defaultValue: "Faites scanner ce code pour comparer vos visites." })}
            </Text>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={qrData}
                size={220}
                color={theme.colors.ink}
                backgroundColor={theme.colors.paper}
              />
            </View>

            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>{t("p2p.myVisits", { defaultValue: "Mes Boutiques" })}</Text>
              <Text style={styles.statsValue}>{myVisitsCount}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.scanSection}>
            <Text style={styles.title}>{t("p2p.scanCode", { defaultValue: "Scanner un QR Code" })}</Text>
            
            {!permission?.granted ? (
              <View style={styles.permissionBox}>
                <Text style={styles.subtitle}>{t("p2p.needCamera", { defaultValue: "L'accès à la caméra est requis." })}</Text>
                <Pressable style={styles.primaryButton} onPress={requestPermission}>
                  <Text style={styles.primaryButtonText}>{t("p2p.grantPermission", { defaultValue: "Autoriser la caméra" })}</Text>
                </Pressable>
              </View>
            ) : !scannedData ? (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={handleScan}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"]
                  }}
                />
              </View>
            ) : (
              <View style={styles.resultSection}>
                <View style={styles.successBox}>
                  <Text style={styles.successText}>{t("p2p.scanSuccess", { defaultValue: "Profil scanné avec succès !" })}</Text>
                </View>
                <View style={styles.comparisonGrid}>
                  <View style={styles.comparisonCol}>
                    <Text style={styles.statsLabel}>{t("p2p.myVisits", { defaultValue: "Moi" })}</Text>
                    <Text style={styles.statsValue}>{myVisitsCount}</Text>
                  </View>
                  <View style={styles.comparisonCol}>
                    <Text style={styles.statsLabel}>{t("p2p.theirVisits", { defaultValue: "Ami" })}</Text>
                    <Text style={styles.statsValue}>{scannedVisitsCount}</Text>
                  </View>
                </View>
                <Pressable style={styles.secondaryButton} onPress={() => setScannedData(null)}>
                  <Text style={styles.secondaryButtonText}>{t("p2p.scanAnother", { defaultValue: "Scanner un autre code" })}</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, typography, spacing, shadows, radii } = theme;
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
    tabs: {
      flex: 1,
      flexDirection: "row",
      backgroundColor: colors.paper,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 4
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: 8,
      borderRadius: 6
    },
    activeTab: {
      backgroundColor: colors.ink
    },
    tabText: {
      fontSize: typography.small,
      fontWeight: "700",
      color: colors.muted
    },
    activeTabText: {
      color: colors.paper
    },
    content: {
      padding: spacing.lg
    },
    shareSection: {
      alignItems: "center",
      gap: spacing.lg,
      marginTop: spacing.xl
    },
    scanSection: {
      gap: spacing.lg,
      marginTop: spacing.xl
    },
    title: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.ink,
      textAlign: "center"
    },
    subtitle: {
      fontSize: typography.body,
      color: colors.muted,
      textAlign: "center",
      paddingHorizontal: spacing.md
    },
    qrContainer: {
      backgroundColor: colors.paper,
      padding: spacing.xl,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      ...shadows.md
    },
    statsBox: {
      alignItems: "center",
      backgroundColor: colors.mint,
      padding: spacing.md,
      borderRadius: radii.md,
      minWidth: 150
    },
    statsLabel: {
      fontSize: typography.small,
      color: colors.muted,
      fontWeight: "700",
      textTransform: "uppercase"
    },
    statsValue: {
      fontSize: 32,
      fontWeight: "900",
      color: colors.ink
    },
    permissionBox: {
      alignItems: "center",
      gap: spacing.lg,
      marginTop: spacing.xl
    },
    primaryButton: {
      backgroundColor: colors.ink,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 8
    },
    primaryButtonText: {
      color: colors.paper,
      fontSize: typography.small,
      fontWeight: "800"
    },
    cameraContainer: {
      height: 350,
      borderRadius: radii.lg,
      overflow: "hidden",
      ...shadows.md
    },
    camera: {
      flex: 1
    },
    resultSection: {
      gap: spacing.lg,
      alignItems: "center"
    },
    successBox: {
      backgroundColor: colors.teal,
      padding: spacing.md,
      borderRadius: radii.md,
      width: "100%",
      alignItems: "center"
    },
    successText: {
      color: colors.paper,
      fontWeight: "800",
      fontSize: typography.body
    },
    comparisonGrid: {
      flexDirection: "row",
      gap: spacing.md,
      width: "100%"
    },
    comparisonCol: {
      flex: 1,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.md,
      padding: spacing.lg,
      alignItems: "center",
      ...shadows.sm
    },
    secondaryButton: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 8,
      width: "100%",
      alignItems: "center"
    },
    secondaryButtonText: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "800"
    }
  }), [colors, typography, spacing, shadows, radii]);
}
