import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Shield, EyeOff, HardDrive, ArrowRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/theme/useAppTheme";
import { useOnboardingStatus } from "@/features/user/onboarding";

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const { markOnboardingSeen } = useOnboardingStatus();

  const handleContinue = async () => {
    await markOnboardingSeen();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("onboarding.title", { defaultValue: "Bienvenue sur Atlas" })}</Text>
          <Text style={styles.subtitle}>
            {t("onboarding.subtitle", { defaultValue: "L'application ultime pour explorer et sauvegarder vos visites des plus beaux Apple Stores du monde." })}
          </Text>
        </View>

        <View style={styles.badges}>
          <View style={styles.badgeItem}>
            <View style={styles.iconContainer}>
              <EyeOff color={theme.colors.paper} size={24} />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeTitle}>{t("profile.privacy.noAds", { defaultValue: "Zéro publicité" })}</Text>
              <Text style={styles.badgeDesc}>{t("onboarding.noAdsDesc", { defaultValue: "Aucune publicité, aucun tracker." })}</Text>
            </View>
          </View>
          
          <View style={styles.badgeItem}>
            <View style={styles.iconContainer}>
              <HardDrive color={theme.colors.paper} size={24} />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeTitle}>{t("profile.privacy.localLocation", { defaultValue: "Données locales" })}</Text>
              <Text style={styles.badgeDesc}>{t("onboarding.localDesc", { defaultValue: "Vos données restent sur votre appareil." })}</Text>
            </View>
          </View>

          <View style={styles.badgeItem}>
            <View style={styles.iconContainer}>
              <Shield color={theme.colors.paper} size={24} />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeTitle}>{t("profile.privacy.openData", { defaultValue: "Open Data" })}</Text>
              <Text style={styles.badgeDesc}>{t("onboarding.openDataDesc", { defaultValue: "Base de données ouverte et communautaire." })}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{t("onboarding.continue", { defaultValue: "Commencer l'exploration" })}</Text>
          <ArrowRight color={theme.colors.paper} size={20} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, typography, spacing } = theme;
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas
    },
    content: {
      flex: 1,
      padding: spacing.xl,
      justifyContent: "center"
    },
    header: {
      marginBottom: spacing.xl * 2
    },
    title: {
      fontSize: 34,
      fontWeight: "900",
      color: colors.ink,
      marginBottom: spacing.md
    },
    subtitle: {
      fontSize: typography.body,
      color: colors.muted,
      lineHeight: 24
    },
    badges: {
      gap: spacing.xl
    },
    badgeItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.copper,
      alignItems: "center",
      justifyContent: "center"
    },
    badgeTextContainer: {
      flex: 1
    },
    badgeTitle: {
      fontSize: typography.body,
      fontWeight: "800",
      color: colors.ink,
      marginBottom: 2
    },
    badgeDesc: {
      fontSize: typography.small,
      color: colors.muted
    },
    footer: {
      padding: spacing.xl,
      paddingBottom: spacing.xl * 1.5
    },
    button: {
      backgroundColor: colors.ink,
      height: 56,
      borderRadius: 28,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm
    },
    buttonText: {
      color: colors.paper,
      fontSize: typography.body,
      fontWeight: "800"
    }
  });
}
