import React, { useState, useMemo } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/theme/useAppTheme";
import type { StoreRecord } from "./store.types";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { useReducedMotion } from "@/lib/useReducedMotion";

type StoreEditorModalProps = {
  visible: boolean;
  store: StoreRecord | null;
  onClose: () => void;
  onSave: (store: StoreRecord) => Promise<void>;
};

const editableStatusKeys = ["open", "closed", "relocated", "announced", "temporary"] as const;

export function StoreEditorModal({ visible, store, onClose, onSave }: StoreEditorModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles(theme);
  
  const [loading, setLoading] = useState(false);
  const isNew = !store;
  const reduceMotion = useReducedMotion();

  // Initialize form state
  const [id, setId] = useState(store?.id || "");
  const [nameEn, setNameEn] = useState(store?.name?.en || "");
  const [nameFr, setNameFr] = useState(store?.name?.fr || "");
  const [status, setStatus] = useState<StoreRecord["status"]>(store?.status || "open");
  const [city, setCity] = useState(store?.city || "");
  const [countryCode, setCountryCode] = useState(store?.countryCode || "");
  const [address, setAddress] = useState(store?.address || "");
  const [latitude, setLatitude] = useState(store?.coordinates?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(store?.coordinates?.longitude?.toString() || "");
  const [officialUrl, setOfficialUrl] = useState(store?.officialUrl || "");

  const handleSave = async () => {
    if (!id || !nameEn || !city || !countryCode || !address) {
      Alert.alert(t("review.editor.requiredFields"));
      return;
    }

    setLoading(true);
    try {
      const updatedStore: StoreRecord = {
        ...store,
        id,
        status,
        name: { en: nameEn, fr: nameFr || nameEn },
        city,
        countryCode,
        countryName: store?.countryName || countryCode, // Simplified for manual entry
        address,
        coordinates: {
          latitude: parseFloat(latitude) || 0,
          longitude: parseFloat(longitude) || 0,
        },
        officialUrl,
        openedOn: store?.openedOn || null,
        closedOn: store?.closedOn || null,
        architecture: store?.architecture || { era: "Unknown", typology: "Unknown", attributes: {} },
        hours: store?.hours || { policy: "official-link-only", officialUrl, note: "" },
        sources: store?.sources || [],
        photos: store?.photos || [],
        lastVerifiedAt: new Date().toISOString()
      };
      
      await onSave(updatedStore);
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert(t("review.editor.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType={reduceMotion ? "fade" : "slide"} presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <View style={[styles.header, { paddingTop: insets.top + theme.spacing.lg }]}>
            <Text style={styles.title}>
              {isNew ? t("review.editor.createStore") : t("review.editor.editStore")}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X color={theme.colors.ink} size={24} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.field}>
              <Text style={styles.label}>{t("review.editor.fields.id")}</Text>
              <TextInput
                editable={isNew}
                onChangeText={setId}
                placeholder="apple-fifth-avenue"
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                value={id}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("review.editor.fields.nameEn")}</Text>
              <TextInput style={styles.input} value={nameEn} onChangeText={setNameEn} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("review.editor.fields.nameFr")}</Text>
              <TextInput style={styles.input} value={nameFr} onChangeText={setNameFr} />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>{t("review.editor.fields.city")}</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={[styles.field, { flex: 0.5 }]}>
                <Text style={styles.label}>{t("review.editor.fields.country")}</Text>
                <TextInput style={styles.input} value={countryCode} onChangeText={setCountryCode} maxLength={2} autoCapitalize="characters" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("review.editor.fields.address")}</Text>
              <TextInput style={styles.input} value={address} onChangeText={setAddress} multiline />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>{t("review.editor.fields.latitude")}</Text>
                <TextInput style={styles.input} value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>{t("review.editor.fields.longitude")}</Text>
                <TextInput style={styles.input} value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("review.editor.fields.officialUrl")}</Text>
              <TextInput style={styles.input} value={officialUrl} onChangeText={setOfficialUrl} keyboardType="url" autoCapitalize="none" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("review.editor.fields.status")}</Text>
              <View style={styles.statusWrap}>
                {editableStatusKeys.map(s => (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[styles.statusBtn, status === s && styles.statusBtnActive]}
                  >
                    <Text style={[styles.statusText, status === s && styles.statusTextActive]}>
                      {t(`status.${s}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              <Text style={styles.saveBtnText}>
                {loading ? t("review.editor.saving") : t("review.editor.saveStore")}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, radii, spacing, typography } = theme;

  return useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas
    },
    keyboardView: {
      flex: 1
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      backgroundColor: colors.paper
    },
    title: {
      fontSize: typography.title3,
      fontWeight: "800",
      color: colors.ink
    },
    closeBtn: {
      padding: spacing.xs,
      backgroundColor: colors.sky,
      borderRadius: radii.full
    },
    form: {
      padding: spacing.lg,
      gap: spacing.md
    },
    row: {
      flexDirection: "row",
      gap: spacing.md
    },
    field: {
      gap: spacing.xs
    },
    label: {
      fontSize: typography.caption,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase"
    },
    input: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.sm,
      padding: spacing.md,
      fontSize: typography.body,
      color: colors.ink
    },
    statusWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    statusBtn: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    statusBtnActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink
    },
    statusText: {
      fontSize: typography.small,
      fontWeight: "700",
      color: colors.muted
    },
    statusTextActive: {
      color: colors.paper
    },
    footer: {
      padding: spacing.lg,
      backgroundColor: colors.paper,
      borderTopWidth: 1,
      borderTopColor: colors.line
    },
    saveBtn: {
      backgroundColor: colors.copper,
      padding: spacing.md,
      borderRadius: radii.md,
      alignItems: "center"
    },
    saveBtnText: {
      color: colors.paper,
      fontSize: typography.body,
      fontWeight: "800"
    }
  }), [colors, radii, spacing, typography]);
}
