import {
  submitPhoto,
  submitStoreChange
} from "@/features/contributions/contributionApi";
import {
  getStoreName,
  getStorePlace,
  getPhotoSource,
} from "@/features/stores/storeUtils";
import { useStores } from "@/features/stores/useStores";
import { useLocalVisits } from "@/features/visits/localVisits";
import { formatDate, isISODate, todayISO } from "@/lib/date";
import { useAppTheme } from "@/theme/useAppTheme";
import * as ImagePicker from "expo-image-picker";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  Clock,
  Flag,
  MapPin,
  Send,
  Share2,
  X
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StorePhoto, StoreStatus } from "@/features/stores/store.types";

export default function StoreDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stores } = useStores();
  const store = stores.find((item) => item.id === id) ?? stores[0];
  const [visitDate, setVisitDate] = useState(todayISO());
  const [visitNote, setVisitNote] = useState("");
  const [visitMessage, setVisitMessage] = useState<string | null>(null);
  const [changeModalVisible, setChangeModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<StorePhoto | null>(null);
  const [fieldPath, setFieldPath] = useState("");
  const [proposedValue, setProposedValue] = useState("");
  const [note, setNote] = useState("");
  const [contributionFeedback, setContributionFeedback] = useState<{
    message: string;
    tone: "error" | "info" | "success";
  } | null>(null);
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [photoCreditName, setPhotoCreditName] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoTakenOn, setPhotoTakenOn] = useState(todayISO());
  const [peopleVisible, setPeopleVisible] = useState(false);
  const { addVisit, removeVisit, storeVisits } = useLocalVisits(store?.id);
  const name = store ? getStoreName(store, i18n.language) : "";
  const statusColors: Record<StoreStatus, string> = {
    open: theme.colors.teal,
    closed: theme.colors.rose,
    relocated: theme.colors.muted,
    announced: theme.colors.gold,
    temporary: theme.colors.moss
  };

  if (!store) return null;

  const hoursOfficialUrl = store.hours.officialUrl;

  async function handleAddVisit() {
    if (!isISODate(visitDate)) {
      setVisitMessage(t("store.visitInvalidDate"));
      return;
    }

    await addVisit(store.id, visitDate, visitNote);
    setVisitNote("");
    setVisitMessage(t("store.visitSaved"));
  }

  async function handleShareVisit() {
    const date = storeVisits[0]?.visitedOn ?? visitDate;
    await Share.share({
      message: t("store.shareText", {
        date,
        name,
        place: getStorePlace(store)
      })
    });
  }

  async function handleSubmitChange() {
    const trimmedFieldPath = fieldPath.trim();
    const trimmedProposedValue = proposedValue.trim();

    if (!trimmedFieldPath || !trimmedProposedValue) {
      setContributionFeedback({
        message: t("store.changeRequired"),
        tone: "error"
      });
      return;
    }

    try {
      setContributionFeedback({ message: t("store.submitting"), tone: "info" });
      await submitStoreChange({
        storeId: store.id,
        fieldPath: trimmedFieldPath,
        proposedValue: trimmedProposedValue,
        note: note.trim()
      });
      setContributionFeedback({ message: t("store.changeSubmitted"), tone: "success" });
      setFieldPath("");
      setProposedValue("");
      setNote("");
    } catch (error) {
      setContributionFeedback({
        message: error instanceof Error ? error.message : t("store.submitFailed"),
        tone: "error"
      });
    }
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setContributionFeedback({ message: t("store.photoPermissionDenied"), tone: "error" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      exif: false,
      mediaTypes: ["images"],
      quality: 0.86
    });

    if (!result.canceled) {
      setPhotoAsset(result.assets[0]);
      setContributionFeedback(null);
    }
  }

  async function handleSubmitPhoto() {
    if (!photoAsset) {
      setContributionFeedback({ message: t("store.photoRequired"), tone: "error" });
      return;
    }

    if (photoTakenOn && !isISODate(photoTakenOn)) {
      setContributionFeedback({ message: t("store.visitInvalidDate"), tone: "error" });
      return;
    }

    try {
      setContributionFeedback({ message: t("store.submitting"), tone: "info" });
      await submitPhoto({
        storeId: store.id,
        localUri: photoAsset.uri,
        mimeType: photoAsset.mimeType,
        fileName: photoAsset.fileName,
        caption: photoCaption.trim(),
        creditName: photoCreditName.trim(),
        takenOn: photoTakenOn,
        peopleVisible
      });
      setContributionFeedback({ message: t("store.photoSubmitted"), tone: "success" });
      setPhotoAsset(null);
      setPhotoCreditName("");
      setPhotoCaption("");
      setPhotoTakenOn(todayISO());
      setPeopleVisible(false);
    } catch (error) {
      setContributionFeedback({
        message: error instanceof Error ? error.message : t("store.submitFailed"),
        tone: "error"
      });
    }
  }

  function openChangeModal() {
    setContributionFeedback(null);
    setChangeModalVisible(true);
  }

  function openPhotoModal() {
    setContributionFeedback(null);
    setPhotoModalVisible(true);
  }

  function renderContributionFeedback() {
    if (!contributionFeedback) return null;

    const toneStyle =
      contributionFeedback.tone === "success"
        ? styles.feedbackSuccess
        : contributionFeedback.tone === "error"
          ? styles.feedbackError
          : styles.feedbackInfo;

    return (
      <View style={[styles.feedbackBox, toneStyle]}>
        <Text style={styles.feedbackText}>{contributionFeedback.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: name }} />
      
      <Pressable 
        onPress={() => router.back()} 
        style={[styles.backButton, { top: insets.top + 8 }]}
        accessibilityLabel={t("store.back")}
      >
        <ChevronLeft color={theme.colors.teal} size={28} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + theme.spacing.xl,
            paddingTop: insets.top + 60
          }
        ]}
      >

      <View style={styles.hero}>
        <Text style={styles.title}>{name}</Text>
        <View style={styles.locationLine}>
          <MapPin color={theme.colors.muted} size={18} />
          <Text style={styles.location}>{getStorePlace(store)}</Text>
        </View>
        <Text style={styles.address}>{store.address}</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryButton} onPress={handleAddVisit}>
          <Check color={theme.colors.paper} size={18} />
          <Text style={styles.primaryButtonText}>{t("store.markVisited")}</Text>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={handleShareVisit}>
          <Share2 color={theme.colors.ink} size={19} />
        </Pressable>
      </View>

      <View style={styles.visitBox}>
        <CalendarDays color={theme.colors.teal} size={20} />
        <TextInput
          accessibilityLabel={t("store.visitDateLabel")}
          onChangeText={setVisitDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.muted}
          style={styles.dateInput}
          value={visitDate}
        />
      </View>
      <TextInput
        accessibilityLabel={t("store.visitNoteLabel")}
        multiline
        onChangeText={setVisitNote}
        placeholder={t("store.visitNotePlaceholder")}
        placeholderTextColor={theme.colors.muted}
        style={styles.visitNoteInput}
        value={visitNote}
      />
      {visitMessage ? <Text style={styles.message}>{visitMessage}</Text> : null}

      {storeVisits.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("store.personalHistory")}</Text>
          {storeVisits.map((visit) => (
            <View key={visit.id} style={styles.visitRow}>
              <View style={styles.visitRowCopy}>
                <Text style={styles.visitDate}>{visit.visitedOn}</Text>
                {visit.note ? (
                  <Text style={styles.visitNote}>{visit.note}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => removeVisit(visit.id)} style={styles.smallIconButton}>
                <X color={theme.colors.danger} size={16} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("store.history")}</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t("store.status")}</Text>
            <View style={styles.infoStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColors[store.status] }]} />
              <Text style={styles.infoStatusValue}>{t(`status.${store.status}`)}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t("store.opened")}</Text>
            <Text style={styles.infoValue}>
              {formatDate(store.openedOn, t("store.dateUnknown"))}
            </Text>
          </View>
          {store.status !== "open" && store.status !== "announced" && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t("store.closed")}</Text>
              <Text style={styles.infoValue}>
                {formatDate(store.closedOn, t("store.notClosed"))}
              </Text>
            </View>
          )}
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t("store.verified")}</Text>
            <Text style={styles.infoValue}>{store.lastVerifiedAt}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("store.architecture")}</Text>
        <Text style={styles.body}>{store.architecture.typology ?? store.architecture.era}</Text>
        <View style={styles.attributeGrid}>
          {Object.entries(store.architecture.attributes).map(([key, value]) => (
            <View key={key} style={styles.attribute}>
              <Text style={styles.attributeLabel}>
                {t(`attributes.${key}`)}
              </Text>
              <Text style={styles.attributeValue}>{t(`values.${value}`)}</Text>
            </View>
          ))}
        </View>

      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("store.hours")}</Text>
        <View style={styles.hoursBox}>
          <Clock color={theme.colors.moss} size={20} />
          <View style={styles.hoursCopy}>
            <Text style={styles.body}>{t(`hours.${store.hours.policy}`)}</Text>
            <Text style={styles.muted}>{store.hours.note}</Text>
            {hoursOfficialUrl ? (
              <Pressable onPress={() => Linking.openURL(hoursOfficialUrl)}>
                <Text style={styles.sourceLink}>
                  {t("store.verifyOfficial")} ↗
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("store.photos")}</Text>
        {store.photos?.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosList}
          >
            {store.photos.map((photo) => {
              const hasCredit = !!photo.credit;
              const hasCaption = !!photo.caption;

              return (
                <Pressable
                  key={photo.id}
                  accessibilityRole="button"
                  onPress={() => setSelectedPhoto(photo)}
                  style={styles.photoCard}
                >
                  <Image source={getPhotoSource(photo.thumbUrl ?? photo.url)} style={styles.photoImage} />
                  {(hasCaption || hasCredit) && (
                    <View style={styles.photoMeta}>
                      {hasCaption && (
                        <Text style={styles.photoCaption}>{photo.caption}</Text>
                      )}
                      {hasCredit && (
                        <Text style={styles.photoCredit}>
                          © {photo.credit}
                        </Text>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.muted}>{t("store.noPhotos")}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("store.contribute")}</Text>
        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={openChangeModal}>
            <Flag color={theme.colors.teal} size={18} />
            <Text style={styles.secondaryButtonText}>{t("store.suggestEdit")}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openPhotoModal}>
            <Camera color={theme.colors.teal} size={18} />
            <Text style={styles.secondaryButtonText}>{t("store.addPhoto")}</Text>
          </Pressable>
        </View>
      </View>

    </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
        transparent
        visible={!!selectedPhoto}
      >
        <View style={[styles.photoViewerBackdrop, { paddingTop: insets.top + 12 }]}>
          <View style={styles.photoViewerHeader}>
            <Text style={styles.photoViewerTitle}>{t("store.photos")}</Text>
            <Pressable onPress={() => setSelectedPhoto(null)} style={styles.photoViewerClose}>
              <X color={theme.colors.paper} size={22} />
            </Pressable>
          </View>
          {selectedPhoto ? (
            <>
              <Image
                source={getPhotoSource(selectedPhoto.url)}
                style={styles.photoViewerImage}
                resizeMode="contain"
              />
              <View style={[styles.photoViewerMeta, { paddingBottom: insets.bottom + 20 }]}>
                {selectedPhoto.caption ? (
                  <Text style={styles.photoViewerCaption}>{selectedPhoto.caption}</Text>
                ) : null}
                <Text style={styles.photoViewerCredit}>
                  {[selectedPhoto.credit, selectedPhoto.license, selectedPhoto.takenOn]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setChangeModalVisible(false)}
        transparent
        visible={changeModalVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom + theme.spacing.lg }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("store.suggestEdit")}</Text>
              <Pressable onPress={() => setChangeModalVisible(false)}>
                <X color={theme.colors.ink} size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalSheetContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalIntro}>{t("store.suggestEditHelp")}</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("store.fieldPath")}</Text>
                <TextInput
                  onChangeText={setFieldPath}
                  placeholder={t("store.fieldPathPlaceholder")}
                  placeholderTextColor={theme.colors.muted}
                  style={styles.input}
                  value={fieldPath}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("store.proposedValue")}</Text>
                <TextInput
                  onChangeText={setProposedValue}
                  placeholder={t("store.proposedValuePlaceholder")}
                  placeholderTextColor={theme.colors.muted}
                  style={styles.input}
                  value={proposedValue}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("store.note")}</Text>
                <TextInput
                  multiline
                  onChangeText={setNote}
                  placeholder={t("store.notePlaceholder")}
                  placeholderTextColor={theme.colors.muted}
                  style={[styles.input, styles.textArea]}
                  value={note}
                />
              </View>
              <Pressable style={styles.primaryButton} onPress={handleSubmitChange}>
                <Send color={theme.colors.paper} size={18} />
                <Text style={styles.primaryButtonText}>{t("store.submitCorrection")}</Text>
              </Pressable>
              {renderContributionFeedback()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setPhotoModalVisible(false)}
        transparent
        visible={photoModalVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom + theme.spacing.lg }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("store.addPhoto")}</Text>
              <Pressable onPress={() => setPhotoModalVisible(false)}>
                <X color={theme.colors.ink} size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalSheetContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalIntro}>{t("store.photoHelp")}</Text>
              <Pressable style={styles.secondaryButton} onPress={handlePickPhoto}>
                <Camera color={theme.colors.teal} size={18} />
                <Text style={styles.secondaryButtonText}>
                  {photoAsset ? t("store.photoSelected") : t("store.pickPhoto")}
                </Text>
              </Pressable>
              {photoAsset ? (
                <Image source={{ uri: photoAsset.uri }} style={styles.photoPreview} />
              ) : null}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("store.photoCreditName")}</Text>
                <TextInput
                  onChangeText={setPhotoCreditName}
                  placeholder={t("store.photoCreditPlaceholder")}
                  placeholderTextColor={theme.colors.muted}
                  style={styles.input}
                  value={photoCreditName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("store.caption")}</Text>
                <TextInput
                  onChangeText={setPhotoCaption}
                  placeholder={t("store.captionPlaceholder")}
                  placeholderTextColor={theme.colors.muted}
                  style={styles.input}
                  value={photoCaption}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("store.takenOn")}</Text>
                <TextInput
                  onChangeText={setPhotoTakenOn}
                  placeholder={t("store.takenOnPlaceholder")}
                  placeholderTextColor={theme.colors.muted}
                  style={styles.input}
                  value={photoTakenOn}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.body}>{t("store.peopleVisible")}</Text>
                <Switch value={peopleVisible} onValueChange={setPeopleVisible} />
              </View>
              <Pressable style={styles.primaryButton} onPress={handleSubmitPhoto}>
                <Send color={theme.colors.paper} size={18} />
                <Text style={styles.primaryButtonText}>{t("store.submitPhoto")}</Text>
              </Pressable>
              {renderContributionFeedback()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, radii, spacing, typography, shadows } = theme;

  return useMemo(() => StyleSheet.create({
    screen: {
      backgroundColor: colors.canvas,
      flex: 1
    },
    content: {
      padding: spacing.lg,
    },
    backButton: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: radii.full,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      left: spacing.lg,
      position: "absolute",
      width: 44,
      zIndex: 10,
      ...shadows.sm
    },
    hero: {
      gap: spacing.sm
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: radii.full
    },
    title: {
      color: colors.ink,
      fontSize: 36,
      fontWeight: "900",
      letterSpacing: 0,
      lineHeight: 41
    },
    locationLine: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs
    },
    location: {
      color: colors.muted,
      flex: 1,
      fontSize: typography.body,
      lineHeight: 22
    },
    address: {
      color: colors.ink,
      fontSize: typography.body,
      lineHeight: 23
    },
    actionRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: colors.ink,
      borderRadius: 8,
      flexDirection: "row",
      flex: 1,
      gap: spacing.sm,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: spacing.md
    },
    primaryButtonText: {
      color: colors.paper,
      fontSize: typography.small,
      fontWeight: "900"
    },
    secondaryButton: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      flex: 1,
      gap: spacing.sm,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: spacing.md
    },
    secondaryButtonText: {
      color: colors.teal,
      fontSize: typography.small,
      fontWeight: "900"
    },
    iconButton: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      height: 48,
      justifyContent: "center",
      width: 52
    },
    smallIconButton: {
      alignItems: "center",
      height: 30,
      justifyContent: "center",
      width: 30
    },
    visitBox: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md
    },
    dateInput: {
      color: colors.ink,
      flex: 1,
      fontSize: typography.body,
      height: 48
    },
    visitNoteInput: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.ink,
      fontSize: typography.body,
      lineHeight: 22,
      marginTop: spacing.sm,
      minHeight: 76,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      textAlignVertical: "top"
    },
    message: {
      color: colors.copper,
      fontSize: typography.small,
      fontWeight: "700",
      lineHeight: 20,
      marginTop: spacing.sm
    },
    section: {
      borderTopColor: colors.line,
      borderTopWidth: 1,
      marginTop: spacing.xl,
      paddingTop: spacing.lg
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 0,
      marginBottom: spacing.sm
    },
    body: {
      color: colors.ink,
      fontSize: typography.body,
      lineHeight: 23
    },
    muted: {
      color: colors.muted,
      fontSize: typography.small,
      lineHeight: 20
    },
    infoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    infoItem: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexGrow: 1,
      minWidth: "30%",
      padding: spacing.md
    },
    infoLabel: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      textTransform: "uppercase"
    },
    infoValue: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "800",
      marginTop: spacing.xs
    },
    infoStatusRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.xs
    },
    infoStatusValue: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "800"
    },
    visitRow: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
      marginTop: spacing.sm,
      padding: spacing.md
    },
    visitDate: {
      color: colors.ink,
      fontSize: typography.body,
      fontWeight: "800"
    },
    visitRowCopy: {
      flex: 1,
      gap: spacing.xs
    },
    visitNote: {
      color: colors.muted,
      fontSize: typography.small,
      lineHeight: 20
    },
    visitVisibility: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      textTransform: "uppercase"
    },
    attributeGrid: {
      gap: spacing.sm,
      marginTop: spacing.md
    },
    attribute: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: spacing.md
    },
    attributeLabel: {
      color: colors.muted,
      flex: 1,
      fontSize: typography.small
    },
    attributeValue: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "800"
    },
    indicatorLine: {
      color: colors.ink,
      fontSize: 24,
      marginTop: spacing.md
    },
    hoursBox: {
      alignItems: "flex-start",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.md
    },
    hoursCopy: {
      flex: 1,
      gap: spacing.xs
    },
    photosList: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm
    },
    photoCard: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: radii.md,
      borderWidth: 1,
      overflow: "hidden",
      width: 112,
      ...shadows.sm
    },
    photoImage: {
      backgroundColor: colors.line,
      height: 74,
      resizeMode: "cover",
      width: 112
    },
    photoMeta: {
      padding: spacing.sm,
      gap: 2
    },
    photoCaption: {
      color: colors.ink,
      fontSize: typography.caption,
      fontWeight: "700",
      lineHeight: 16
    },
    photoCredit: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      letterSpacing: 0,
      textTransform: "uppercase"
    },
    photoViewerBackdrop: {
      backgroundColor: "rgba(0, 0, 0, 0.92)",
      flex: 1,
      paddingHorizontal: spacing.lg
    },
    photoViewerHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.md
    },
    photoViewerTitle: {
      color: colors.paper,
      fontSize: typography.body,
      fontWeight: "900"
    },
    photoViewerClose: {
      alignItems: "center",
      borderColor: "rgba(255, 255, 255, 0.25)",
      borderRadius: radii.full,
      borderWidth: 1,
      height: 36,
      justifyContent: "center",
      width: 36
    },
    photoViewerImage: {
      alignSelf: "center",
      flex: 1,
      maxHeight: "78%",
      width: "100%"
    },
    photoViewerMeta: {
      backgroundColor: colors.paper,
      borderRadius: 8,
      gap: spacing.xs,
      marginTop: spacing.md,
      padding: spacing.md,
      paddingTop: spacing.md
    },
    photoViewerCaption: {
      color: colors.ink,
      fontSize: typography.body,
      fontWeight: "800",
      lineHeight: 22
    },
    photoViewerCredit: {
      color: colors.muted,
      fontSize: typography.small,
      fontWeight: "800",
      letterSpacing: 0,
      lineHeight: 18
    },
    photoPreview: {
      aspectRatio: 4 / 3,
      backgroundColor: colors.line,
      borderRadius: 8,
      marginTop: spacing.md,
      width: "100%"
    },
    sourceLink: {
      color: colors.teal,
      fontSize: typography.small,
      fontWeight: "800",
      marginTop: spacing.xs
    },
    modalBackdrop: {
      backgroundColor: "rgba(23, 23, 23, 0.35)",
      flex: 1,
      justifyContent: "flex-end"
    },
    modalSheet: {
      backgroundColor: colors.canvas,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      gap: spacing.sm,
      maxHeight: "88%",
      padding: spacing.lg
    },
    modalSheetContent: {
      gap: spacing.sm,
      paddingBottom: spacing.xs
    },
    modalHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.sm
    },
    modalTitle: {
      color: colors.ink,
      fontSize: 22,
      fontWeight: "900"
    },
    modalIntro: {
      color: colors.muted,
      fontSize: typography.small,
      lineHeight: 20
    },
    inputGroup: {
      gap: spacing.xs
    },
    inputLabel: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "900",
      textTransform: "uppercase"
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
      minHeight: 96,
      textAlignVertical: "top"
    },
    switchRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between"
    },
    feedbackBox: {
      borderRadius: 8,
      borderWidth: 1,
      padding: spacing.md
    },
    feedbackInfo: {
      backgroundColor: colors.sky,
      borderColor: colors.line
    },
    feedbackSuccess: {
      backgroundColor: colors.mint,
      borderColor: colors.teal
    },
    feedbackError: {
      backgroundColor: colors.paper,
      borderColor: colors.danger
    },
    feedbackText: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "800",
      lineHeight: 20
    }
  }), [colors, radii, shadows, spacing, typography]);
}
