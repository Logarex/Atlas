import React, { useState } from "react";
import { Modal, StyleSheet, Text, TextInput, View, Pressable, ScrollView, SafeAreaView, Switch } from "react-native";
import { colors, radii, shadows, spacing, typography } from "@/theme/tokens";
import type { StoreRecord } from "./store.types";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";

type StoreEditorModalProps = {
  visible: boolean;
  store: StoreRecord | null;
  onClose: () => void;
  onSave: (store: StoreRecord) => Promise<void>;
};

export function StoreEditorModal({ visible, store, onClose, onSave }: StoreEditorModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isNew = !store;

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
      alert("Please fill all required fields (ID, Name, City, Country, Address)");
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
      alert("Failed to save store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{isNew ? "Create Store" : "Edit Store"}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X color={colors.ink} size={24} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>ID (slug) *</Text>
            <TextInput 
              style={styles.input} 
              value={id} 
              onChangeText={setId} 
              editable={isNew} 
              placeholder="apple-fifth-avenue"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Name (EN) *</Text>
            <TextInput style={styles.input} value={nameEn} onChangeText={setNameEn} />
          </View>
          
          <View style={styles.field}>
            <Text style={styles.label}>Name (FR)</Text>
            <TextInput style={styles.input} value={nameFr} onChangeText={setNameFr} />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} />
            </View>
            <View style={[styles.field, { flex: 0.5 }]}>
              <Text style={styles.label}>Country *</Text>
              <TextInput style={styles.input} value={countryCode} onChangeText={setCountryCode} maxLength={2} autoCapitalize="characters" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Address *</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} multiline />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput style={styles.input} value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput style={styles.input} value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Official URL</Text>
            <TextInput style={styles.input} value={officialUrl} onChangeText={setOfficialUrl} keyboardType="url" autoCapitalize="none" />
          </View>
          
          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusWrap}>
              {["open", "closed", "relocated", "announced", "temporary"].map(s => (
                <Pressable 
                  key={s} 
                  onPress={() => setStatus(s as any)}
                  style={[styles.statusBtn, status === s && styles.statusBtnActive]}
                >
                  <Text style={[styles.statusText, status === s && styles.statusTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save Store"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas
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
});
