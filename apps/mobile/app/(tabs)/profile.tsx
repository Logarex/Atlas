import { colors, spacing, typography } from "@/theme/tokens";
import { CalendarDays, Lock, UsersRound } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

const items = [
  { key: "visits", icon: CalendarDays },
  { key: "friends", icon: UsersRound },
  { key: "privacy", icon: Lock }
] as const;

export default function ProfileScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t("profile.kicker")}</Text>
        <Text style={styles.title}>{t("profile.title")}</Text>
        <Text style={styles.subtitle}>{t("profile.subtitle")}</Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <View key={item.key} style={styles.item}>
              <Icon color={colors.teal} size={22} />
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>
                  {t(`profile.items.${item.key}.title`)}
                </Text>
                <Text style={styles.itemText}>
                  {t(`profile.items.${item.key}.copy`)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  header: {
    padding: spacing.lg
  },
  kicker: {
    color: colors.copper,
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 36,
    marginTop: spacing.xs
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm
  },
  list: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  item: {
    alignItems: "flex-start",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  itemCopy: {
    flex: 1
  },
  itemTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "800",
    letterSpacing: 0
  },
  itemText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: spacing.xs
  }
});
