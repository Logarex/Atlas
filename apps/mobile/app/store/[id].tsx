import {
  submitPhoto,
  submitStoreChange
} from "@/features/contributions/contributionApi";
import {
  getMarkerEmoji,
  getPhotoSource,
  getPhotoThumbUrl,
  getPhotoFullUrl,
  getPositiveAttributeKeys,
  getStoreName,
  getStorePlace,
  normalizePhotoUri,
  normalizeI18nKey,
  statusEmojis
} from "@/features/stores/storeUtils";
import { createShareCardJpegBase64 } from "@/features/stores/shareCardImage";
import { useStores } from "@/features/stores/useStores";
import { getArchitectureDetailImage } from "@/features/architecture/architectureImages";
import {
  removeLocalUserPhoto,
  saveLocalUserPhoto,
  useLocalUserPhotos
} from "@/features/user/localUserData";
import { useLocalVisits } from "@/features/visits/localVisits";
import { AudioRecorder } from "@/features/visits/AudioRecorder";
import { formatDate, isISODate, parseISODate, todayISO } from "@/lib/date";
import { useAppTheme } from "@/theme/useAppTheme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image as ExpoImage } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Image as ImageIcon,
  ImagePlus,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
  View,
  FlatList,
  Dimensions
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  ArchitectureAttribute,
  StorePhoto,
  StoreStatus
} from "@/features/stores/store.types";

type FeedbackTone = "error" | "info" | "success";

type InlineFeedback = {
  message: string;
  tone: FeedbackTone;
};

type ShareTarget = "card" | "mail" | "messages" | "social";

type ArchitectureDetailSelection =
  | {
      kind: "attribute";
      label: string;
      value: ArchitectureAttribute;
    }
  | {
      kind: "era" | "typology";
      label: string;
      value: string;
    }
  | {
      kind: "note";
      label: string;
      value: string;
    };

const shareCardColors = {
  canvas: "#F7F1E5",
  copper: "#C85B36",
  ink: "#243420",
  line: "#DED3BF",
  muted: "#6F6656",
  paper: "#FFFDF8",
  teal: "#486B3C"
};

const architectureEraDetailKeys: Record<string, string> = {
  "Glass Cube Flagship": "glassCubeFlagship",
  "Original Retail": "originalRetail",
  "Town Square": "townSquare",
  Unknown: "unknown"
};

const architectureTypologyDetailKeys: Record<string, string> = {
  Classic: "classic",
  "Classic Upgrade": "classicUpgrade",
  "Historic urban flagship": "historicUrbanFlagship",
  "Mall store": "mallStore",
  NSD: "nsd",
  "Standalone pavilion": "standalonePavilion",
  "Urban flagship": "urbanFlagship",
  Unknown: "unknown",
  "Vintage D.2": "vintageD2",
  "Vintage E": "vintageE",
  "Watch Shop": "watchShop"
};

export default function StoreDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);
  
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { stores } = useStores();
  const store = stores.find((item) => item.id === id) ?? null;
  const [visitDate, setVisitDate] = useState(todayISO());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [visitNote, setVisitNote] = useState("");
  const [visitAudioUri, setVisitAudioUri] = useState<string | null>(null);
  const [visitFeedback, setVisitFeedback] = useState<InlineFeedback | null>(null);
  const [changeModalVisible, setChangeModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<StorePhoto | null>(null);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { width: screenWidth } = Dimensions.get("window");
  const [selectedArchitectureDetail, setSelectedArchitectureDetail] =
    useState<ArchitectureDetailSelection | null>(null);
  const [fieldPath, setFieldPath] = useState("");
  const [proposedValue, setProposedValue] = useState("");
  const [note, setNote] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [contributionFeedback, setContributionFeedback] = useState<InlineFeedback | null>(null);
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [photoCreditName, setPhotoCreditName] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoTakenOn, setPhotoTakenOn] = useState(todayISO());
  const [peopleVisible, setPeopleVisible] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<InlineFeedback | null>(null);
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);
  const photoPickerOpenRef = useRef(false);
  const shareCardRef = useRef<View>(null);
  const { addVisit, removeVisit, storeVisits } = useLocalVisits(store?.id);
  const { storePhotos: privatePhotos } = useLocalUserPhotos(store?.id);
  const name = store ? getStoreName(store, i18n.language) : "";
  const storePhotoUrls = useMemo(() => {
    return (store?.photos ?? [])
      .flatMap((photo) => [getPhotoThumbUrl(photo), getPhotoFullUrl(photo)])
      .filter((url): url is string => !!url && /^https?:\/\//i.test(url))
      .map(normalizePhotoUri);
  }, [store]);
  const statusColors: Record<StoreStatus, string> = {
    open: theme.colors.teal,
    closed: theme.colors.ink,
    relocated: theme.colors.muted,
    announced: theme.colors.gold,
    temporary: theme.colors.moss
  };

  useEffect(() => {
    const urls = [...new Set(storePhotoUrls)].slice(0, 20); // prefetch up to 10 photos (thumb + full)
    if (urls.length === 0) return;

    void ExpoImage.prefetch(urls, "memory-disk").catch(() => false);
  }, [storePhotoUrls]);

  if (!store) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: t("store.notFoundTitle") }} />
        <View
          style={[
            styles.missingState,
            {
              paddingBottom: insets.bottom + theme.spacing.xl,
              paddingTop: insets.top + theme.spacing.xl
            }
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("store.back")}
            onPress={() => router.canGoBack() && router.back()}
            style={styles.compactBackButton}
          >
            <ChevronLeft color={theme.colors.ink} size={22} />
          </Pressable>
          <Text style={styles.sectionTitle}>{t("store.notFoundTitle")}</Text>
          <Text style={styles.muted}>{t("store.notFoundBody")}</Text>
        </View>
      </View>
    );
  }

  const storeId = store.id;
  const hoursOfficialUrl = store.hours.officialUrl;
  const officialUrl = store.officialUrl ?? hoursOfficialUrl;
  const positiveArchitectureAttributes = getPositiveAttributeKeys(store);
  const architectureSummary = store.architecture.typology ?? store.architecture.era;
  const shareCoverPhoto = store.photos?.[0];
  const shareDate = storeVisits[0]?.visitedOn ?? visitDate;
  const place = getStorePlace(store);
  const shareMessage = t("store.shareText", {
    date: shareDate,
    name,
    place
  });
  const shareMessageWithUrl = officialUrl ? `${shareMessage}\n${officialUrl}` : shareMessage;
  const architectureDetailImageSource = selectedArchitectureDetail 
    ? getArchitectureDetailImage(selectedArchitectureDetail.value)
    : undefined;

  function getArchitectureDetailBody(detail: ArchitectureDetailSelection) {
    if (detail.kind === "note") return detail.value;

    if (detail.kind === "attribute") {
      return t(`architectureDetails.attributes.${detail.value}.body`);
    }

    if (detail.kind === "era") {
      const detailKey = architectureEraDetailKeys[detail.value];
      return detailKey
        ? t(`architectureDetails.eras.${detailKey}.body`)
        : t("architectureDetails.eraFallback", { value: detail.value });
    }

    const detailKey = architectureTypologyDetailKeys[detail.value];
    return detailKey
      ? t(`architectureDetails.typologies.${detailKey}.body`)
      : t("architectureDetails.typologyFallback", { value: detail.value });
  }

  function renderFeedback(feedback: InlineFeedback | null) {
    if (!feedback) return null;

    const toneStyle =
      feedback.tone === "success"
        ? styles.feedbackSuccess
        : feedback.tone === "error"
          ? styles.feedbackError
          : styles.feedbackInfo;

    return (
      <View style={[styles.feedbackBox, toneStyle]}>
        <Text style={styles.feedbackText}>{feedback.message}</Text>
      </View>
    );
  }

  async function handleAddVisit() {
    if (!isISODate(visitDate)) {
      setVisitFeedback({ message: t("store.visitInvalidDate"), tone: "error" });
      return;
    }

    await addVisit(storeId, visitDate, visitNote, visitAudioUri || undefined);
    setVisitNote("");
    setVisitAudioUri(null);
    setVisitFeedback({ message: t("store.visitSaved"), tone: "success" });
  }

  async function handleShareVisit(options?: { closeModal?: boolean; silentError?: boolean }) {
    try {
      await Share.share({
        message: shareMessageWithUrl,
        title: t("store.shareTitle", { name }),
        ...(officialUrl ? { url: officialUrl } : {})
      });
      setShareFeedback(null);
      if (options?.closeModal) setShareModalVisible(false);
    } catch {
      if (!options?.silentError) {
        setShareFeedback({ message: t("store.shareFailed"), tone: "error" });
      }
    }
  }

  async function createShareCardImageUri() {
    try {
      if (shareCardRef.current) {
        const capturedUri = await captureRef(shareCardRef, {
          format: "jpg",
          quality: 0.92,
          result: "tmpfile"
        });
        if (capturedUri) return capturedUri;
      }
    } catch {
      // The pure JS fallback below keeps sharing available if native capture fails.
    }

    const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

    if (!directory) {
      return null;
    }

    const cardUri = `${directory}atlas-share-card-${storeId}-${Date.now()}.jpg`;
    const cardBase64 = createShareCardJpegBase64({
      brand: "Atlas Places",
      place,
      tagline: t("store.shareCardTagline"),
      title: name,
      visitedLabel: t("store.shareCardVisited", { date: shareDate })
    });

    await FileSystem.writeAsStringAsync(cardUri, cardBase64, {
      encoding: FileSystem.EncodingType.Base64
    });

    return cardUri;
  }

  async function handleShareCard(target: ShareTarget = "card") {
    try {
      setShareFeedback({ message: t("store.sharePreparing"), tone: "info" });
      const cardUri = await createShareCardImageUri();

      if (!cardUri) {
        await handleShareVisit({ closeModal: true, silentError: true });
        return;
      }

      if (Platform.OS === "ios") {
        await Share.share(
          {
            message: shareMessageWithUrl,
            title: t("store.shareTitle", { name }),
            url: cardUri
          },
          {
            subject: t("store.shareTitle", { name })
          }
        );
        setShareFeedback(null);
        setShareModalVisible(false);
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(cardUri, {
          dialogTitle: t(
            target === "mail"
              ? "store.shareMail"
              : target === "messages"
                ? "store.shareMessages"
                : target === "social"
                  ? "store.shareSocial"
                  : "store.shareCard"
          ),
          mimeType: "image/jpeg",
          UTI: "public.jpeg"
        });
        setShareFeedback(null);
        setShareModalVisible(false);
        return;
      }

      await handleShareVisit({ closeModal: true, silentError: true });
    } catch {
      setShareFeedback({ message: t("store.shareCardFailed"), tone: "error" });
      await handleShareVisit({ silentError: true });
    }
  }

  function isSameArchitectureDetail(
    current: ArchitectureDetailSelection | null,
    next: ArchitectureDetailSelection
  ) {
    return current?.kind === next.kind && current.label === next.label && current.value === next.value;
  }

  function toggleArchitectureDetail(next: ArchitectureDetailSelection) {
    setSelectedArchitectureDetail((current) =>
      isSameArchitectureDetail(current, next) ? null : next
    );
  }

  function openArchitecturePhotoModal() {
    if (!photoCaption.trim()) {
      setPhotoCaption(t("store.architecturePhotoCaption", { name }));
    }
    openPhotoModal();
  }

  async function handleSubmitChange() {
    if (isSubmittingChange) return;
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
      setIsSubmittingChange(true);
      setContributionFeedback({ message: t("store.submitting"), tone: "info" });
      await submitStoreChange({
        storeId,
        fieldPath: trimmedFieldPath,
        proposedValue: trimmedProposedValue,
        note: note.trim(),
        contributorName: contributorName.trim()
      });
      setContributionFeedback({ message: t("store.changeSubmitted"), tone: "success" });
      setFieldPath("");
      setProposedValue("");
      setNote("");
      setContributorName("");
    } catch (error) {
      setContributionFeedback({
        message: error instanceof Error ? error.message : t("store.submitFailed"),
        tone: "error"
      });
    } finally {
      setIsSubmittingChange(false);
    }
  }

  async function handlePickPhoto() {
    if (photoPickerOpenRef.current) {
      return;
    }

    try {
      photoPickerOpenRef.current = true;
      setPhotoPickerOpen(true);
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
    } catch {
      setContributionFeedback({ message: t("store.photoPermissionDenied"), tone: "error" });
    } finally {
      photoPickerOpenRef.current = false;
      setPhotoPickerOpen(false);
    }
  }

  async function handleSavePrivatePhoto() {
    // Check permission status first without showing a dialog.
    // This way, if permission is already granted the picker opens immediately
    // on the first tap. The dialog is only shown when truly needed.
    const existingPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!existingPermission.granted) {
      const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!requested.granted) {
        setContributionFeedback({ message: t("store.photoPermissionDenied"), tone: "error" });
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      exif: false,
      mediaTypes: ["images"],
      quality: 0.92
    });

    if (result.canceled) return;

    try {
      const asset = result.assets[0];
      await saveLocalUserPhoto({
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        sourceUri: asset.uri,
        storeId,
        takenOn: todayISO()
      });
      setContributionFeedback({ message: t("store.privatePhotoSaved"), tone: "success" });
    } catch (error) {
      setContributionFeedback({
        message: error instanceof Error ? error.message : t("store.submitFailed"),
        tone: "error"
      });
    }
  }

  async function handleSubmitPhoto() {
    if (isSubmittingPhoto) return;
    if (!photoAsset) {
      setContributionFeedback({ message: t("store.photoRequired"), tone: "error" });
      return;
    }

    if (photoTakenOn && !isISODate(photoTakenOn)) {
      setContributionFeedback({ message: t("store.visitInvalidDate"), tone: "error" });
      return;
    }

    try {
      setIsSubmittingPhoto(true);
      setContributionFeedback({ message: t("store.submitting"), tone: "info" });
      await submitPhoto({
        storeId,
        localUri: photoAsset.uri,
        mimeType: photoAsset.mimeType,
        fileName: photoAsset.fileName,
        caption: photoCaption.trim(),
        creditName: photoCreditName.trim(),
        contributorName: photoCreditName.trim(),
        width: photoAsset.width,
        height: photoAsset.height,
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
    } finally {
      setIsSubmittingPhoto(false);
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

  function renderShareCard() {
    return (
      <View style={styles.shareCardSurface}>
        <View style={styles.shareCardAccent} />
        <View style={styles.shareCardHeader}>
          <View style={styles.shareCardBrandRow}>
            <View style={styles.shareCardMark}>
              <Text style={styles.shareCardMarkText}>A</Text>
            </View>
            <Text style={styles.shareCardBrand}>Atlas Places</Text>
          </View>
          <Text style={styles.shareCardDate}>
            {t("store.shareCardVisited", { date: shareDate })}
          </Text>
        </View>
        <View style={styles.shareCardBody}>
          <Text numberOfLines={2} style={styles.shareCardTitle}>
            {name}
          </Text>
          <Text numberOfLines={1} style={styles.shareCardPlace}>
            {place}
          </Text>
        </View>
        <View style={styles.shareCardFooter}>
          <Text numberOfLines={1} style={styles.shareCardTagline}>
            {t("store.shareCardTagline")}
          </Text>
          <View style={styles.shareCardFooterRule} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: name }} />
      <View pointerEvents="none" style={styles.shareCardCaptureHost}>
        <View collapsable={false} ref={shareCardRef} style={styles.shareCardCapture}>
          {renderShareCard()}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + theme.spacing.xl,
            paddingTop: insets.top + theme.spacing.sm
          }
        ]}
      >

      <View style={styles.hero}>
        <View style={styles.heroNavRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("store.back")}
            onPress={() => router.canGoBack() && router.back()}
            style={styles.compactBackButton}
          >
            <ChevronLeft color={theme.colors.ink} size={22} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t("store.shareVisit")} style={styles.compactBackButton} onPress={() => setShareModalVisible(true)}>
            <Share2 color={theme.colors.ink} size={19} />
          </Pressable>
        </View>
        <Text style={styles.title}>{name}</Text>
        <View style={styles.locationLine}>
          <MapPin color={theme.colors.muted} size={18} />
          <Text style={styles.location}>{getStorePlace(store)}</Text>
        </View>
        <Text style={styles.address}>{store.address}</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: theme.colors.copper }]} onPress={handleAddVisit}>
          <Check color={theme.colors.paper} size={18} />
          <Text style={styles.primaryButtonText}>{t("store.markVisited")}</Text>
        </Pressable>
      </View>

      <View style={styles.visitBox}>
        <CalendarDays color={theme.colors.teal} size={20} />
        <Pressable onPress={() => setShowDatePicker(true)} style={{ flex: 1, height: 48, justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.ink, fontSize: theme.typography.body }}>
            {formatDate(visitDate, visitDate, i18n.language)}
          </Text>
        </Pressable>
        {Platform.OS === "ios" && (
          <Modal
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
            transparent={true}
            visible={showDatePicker}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowDatePicker(false)}
              style={styles.modalBackdrop}
            >
              <View
                accessible={true}
                onStartShouldSetResponder={() => true}
                style={[styles.modalSheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}
              >
                <DateTimePicker
                  value={parseISODate(visitDate)}
                  mode="date"
                  display="inline"
                  themeVariant={theme.isDark ? "dark" : "light"}
                  accentColor={theme.colors.copper}
                  onChange={(_, date) => {
                    if (date) setVisitDate(date.toISOString().split("T")[0]);
                  }}
                />
              </View>
            </Pressable>
          </Modal>
        )}
        {Platform.OS !== "ios" && showDatePicker && (
          <DateTimePicker
            value={parseISODate(visitDate)}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (event.type === "set" && date) {
                setVisitDate(date.toISOString().split("T")[0]);
              }
            }}
          />
        )}
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
      <AudioRecorder audioUri={visitAudioUri} setAudioUri={setVisitAudioUri} />
      {visitFeedback ? (
        <Text
          style={[
            styles.message,
            visitFeedback.tone === "success" ? styles.messageSuccess : styles.messageError
          ]}
        >
          {visitFeedback.message}
        </Text>
      ) : null}

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
                {visit.audioUri ? (
                  <AudioRecorder audioUri={visit.audioUri} readOnly />
                ) : null}
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t("store.removeVisit")} onPress={() => removeVisit(visit.id)} style={styles.smallIconButton}>
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
        <View style={styles.architectureSummary}>
          <View style={styles.architectureBadge}>
            <Sparkles color={theme.colors.copper} size={16} />
          </View>
          <View style={styles.architectureCopy}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                toggleArchitectureDetail({
                  kind: store.architecture.typology ? "typology" : "era",
                  label: t(`architectureDetails.${store.architecture.typology ? "typologies" : "eras"}.${normalizeI18nKey(architectureSummary)}.title`, { defaultValue: architectureSummary }),
                  value: normalizeI18nKey(architectureSummary)
                })
              }
              style={styles.architectureTitleButton}
            >
              <Text style={styles.architectureTitle}>
                {t(`architectureDetails.${store.architecture.typology ? "typologies" : "eras"}.${normalizeI18nKey(architectureSummary)}.title`, { defaultValue: architectureSummary })}
              </Text>
              <Info color={theme.colors.muted} size={15} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                toggleArchitectureDetail({
                  kind: "era",
                  label: t(`architectureDetails.eras.${normalizeI18nKey(store.architecture.era)}.title`, { defaultValue: store.architecture.era }),
                  value: normalizeI18nKey(store.architecture.era)
                })
              }
              style={styles.architectureEraButton}
            >
              <Text style={styles.architectureEraText}>
                {t("store.architectureEra", { era: t(`architectureDetails.eras.${normalizeI18nKey(store.architecture.era)}.title`, { defaultValue: store.architecture.era }) })}
              </Text>
            </Pressable>
          </View>
        </View>

        {positiveArchitectureAttributes.length > 0 ? (
          <View style={styles.attributeChipGrid}>
            {positiveArchitectureAttributes.map((key) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selectedArchitectureDetail?.kind === "attribute" && selectedArchitectureDetail.value === key }}
                key={key}
                onPress={() =>
                  toggleArchitectureDetail({
                    kind: "attribute",
                    label: t(`attributes.${key}`),
                    value: key
                  })
                }
                style={[
                  styles.attributeChip,
                  selectedArchitectureDetail?.kind === "attribute" &&
                    selectedArchitectureDetail.value === key &&
                    styles.attributeChipActive
                ]}
              >
                <Text
                  style={[
                    styles.attributeChipText,
                    selectedArchitectureDetail?.kind === "attribute" &&
                      selectedArchitectureDetail.value === key &&
                      styles.attributeChipTextActive
                  ]}
                >
                  {t(`attributes.${key}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>{t("store.architectureEmpty")}</Text>
        )}

        {store.architecture.notes?.length ? (
          <View style={styles.architectureNotes}>
            {store.architecture.notes.map((architectureNote) => (
              <Pressable
                accessibilityRole="button"
                key={architectureNote}
                onPress={() =>
                  toggleArchitectureDetail({
                    kind: "note",
                    label: t("store.architectureNote"),
                    value: architectureNote
                  })
                }
                style={styles.architectureNoteButton}
              >
                <Text style={styles.architectureNote}>
                  {t(`architectureDetails.notes.${normalizeI18nKey(architectureNote)}`, { defaultValue: architectureNote })}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {selectedArchitectureDetail ? (
          <View style={styles.architectureDetailCard}>
            {architectureDetailImageSource ? (
              <ExpoImage
                cachePolicy="memory-disk"
                contentFit="cover"
                source={architectureDetailImageSource}
                style={styles.architectureDetailImage}
                transition={180}
              />
            ) : null}
            <View style={styles.architectureDetailCopy}>
              <View style={styles.architectureDetailTitleRow}>
                <Info color={theme.colors.copper} size={18} />
                <Text style={styles.architectureDetailTitle}>
                  {selectedArchitectureDetail.label}
                </Text>
              </View>
              <Text style={styles.architectureDetailBody}>
                {getArchitectureDetailBody(selectedArchitectureDetail)}
              </Text>
              {selectedArchitectureDetail.kind !== "note" && store.architecture.notes?.length ? (
                <View style={styles.architectureContextBox}>
                  <Text style={styles.architectureContextLabel}>
                    {t("store.architectureLocalContext")}
                  </Text>
                  {store.architecture.notes.map((architectureNote) => (
                    <Text key={architectureNote} style={styles.architectureContextText}>
                      {t(`architectureDetails.notes.${normalizeI18nKey(architectureNote)}`, { defaultValue: architectureNote })}
                    </Text>
                  ))}
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={openArchitecturePhotoModal}
                style={styles.architectureImageButton}
              >
                <ImagePlus color={theme.colors.teal} size={17} />
                <Text style={styles.architectureImageButtonText}>
                  {t("store.architectureAddImage")}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("store.hours")}</Text>
        <View style={styles.hoursBox}>
          <Clock color={theme.colors.moss} size={20} />
          <View style={styles.hoursCopy}>
            <Text style={styles.body}>{t(`hours.${store.hours.policy}`)}</Text>
            <Text style={styles.muted}>{store.hours.note}</Text>
            {hoursOfficialUrl ? (
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(hoursOfficialUrl)}>
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
            snapToInterval={280 + theme.spacing.sm}
            decelerationRate="fast"
          >
            {store.photos.map((photo) => {
              const hasCredit = !!photo.credit;
              const hasCaption = !!photo.caption;

              return (
                <Pressable
                  key={photo.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setPhotoViewerIndex(store.photos!.findIndex(p => p.id === photo.id));
                    setSelectedPhoto(photo);
                  }}
                  style={styles.photoCard}
                >
                  <ExpoImage
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    priority="high"
                    source={getPhotoSource(getPhotoThumbUrl(photo))}
                    style={styles.photoImage}
                    transition={160}
                  />
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
        {privatePhotos.length > 0 ? (
          <>
            <Text style={styles.photoSubsectionTitle}>{t("store.privatePhotos")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosList}
            >
              {privatePhotos.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  <ExpoImage
                    contentFit="cover"
                    source={{ uri: photo.uri }}
                    style={styles.photoImage}
                    transition={160}
                  />
                  <View style={styles.photoMeta}>
                    <Text style={styles.photoCaption} numberOfLines={2}>
                      {photo.caption || t("store.privatePhoto")}
                    </Text>
                    <Text style={styles.photoCredit}>{photo.takenOn ?? t("store.localOnly")}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("store.removePrivatePhoto")}
                    onPress={() => removeLocalUserPhoto(photo.id)}
                    style={styles.photoRemoveButton}
                  >
                    <X color={theme.colors.paper} size={14} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}
        <Pressable
          accessibilityRole="button"
          style={[styles.secondaryButton, styles.privatePhotoButton]}
          onPress={handleSavePrivatePhoto}
        >
          <ImageIcon color={theme.colors.teal} size={18} />
          <Text style={styles.secondaryButtonText}>{t("store.savePrivatePhoto")}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("store.contribute")}</Text>
        <View style={styles.actionRow}>
          <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={openChangeModal}>
            <Flag color={theme.colors.teal} size={18} />
            <Text style={styles.secondaryButtonText}>{t("store.suggestEdit")}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={openPhotoModal}>
            <Camera color={theme.colors.teal} size={18} />
            <Text style={styles.secondaryButtonText}>{t("store.addPhoto")}</Text>
          </Pressable>
        </View>
      </View>

    </ScrollView>

      <Modal
        animationType={reduceMotion ? "fade" : "slide"}
        onRequestClose={() => setShareModalVisible(false)}
        transparent
        visible={shareModalVisible}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom + theme.spacing.lg }
            ]}
          >
            <View style={styles.shareHero}>
              <View style={styles.shareBrandMark}>
                <Text style={styles.shareBrandMarkText}>A</Text>
              </View>
              <View style={styles.shareHeroCopy}>
                <Text style={styles.modalTitle}>{t("store.shareVisit")}</Text>
                <Text style={styles.modalIntro}>{t("store.shareIntro")}</Text>
              </View>
              <Pressable onPress={() => setShareModalVisible(false)} accessibilityRole="button" accessibilityLabel={t("store.close")} style={styles.shareCloseButton}>
                <X color={theme.colors.ink} size={22} />
              </Pressable>
            </View>

            <View style={styles.sharePreview}>
              {renderShareCard()}
            </View>

            <View style={styles.shareGrid}>
              <Pressable accessibilityRole="button" style={styles.shareOption} onPress={() => handleShareCard("messages")}>
                <MessageCircle color={theme.colors.teal} size={21} />
                <Text style={styles.shareOptionText}>{t("store.shareMessages")}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.shareOption} onPress={() => handleShareCard("mail")}>
                <Mail color={theme.colors.teal} size={21} />
                <Text style={styles.shareOptionText}>{t("store.shareMail")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.shareOption}
                onPress={() => handleShareCard("social")}
              >
                <Share2 color={theme.colors.teal} size={21} />
                <Text style={styles.shareOptionText}>{t("store.shareSocial")}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.shareOption} onPress={() => handleShareCard("card")}>
                <ImageIcon color={theme.colors.teal} size={21} />
                <Text style={styles.shareOptionText}>{t("store.shareCard")}</Text>
              </Pressable>
            </View>
            {renderFeedback(shareFeedback)}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
        transparent
        visible={!!selectedPhoto}
      >
        <View style={styles.photoViewerBackdrop}>
          <View style={[styles.photoViewerHeader, { paddingTop: insets.top + 12 }]} pointerEvents="box-none">
            <Text style={styles.photoViewerTitle}>
              {store.photos && store.photos.length > 1
                ? `${photoViewerIndex + 1} / ${store.photos.length}`
                : t("store.photos")}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t("store.close")} onPress={() => setSelectedPhoto(null)} style={styles.photoViewerClose}>
              <X color={theme.colors.paper} size={22} />
            </Pressable>
          </View>
          {selectedPhoto && store.photos ? (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <FlatList
                ref={flatListRef}
                data={store.photos}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                snapToInterval={screenWidth}
                snapToAlignment="center"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={photoViewerIndex}
                getItemLayout={(_, index) => ({
                  length: screenWidth,
                  offset: screenWidth * index,
                  index,
                })}
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                  setPhotoViewerIndex(newIndex);
                }}
                renderItem={({ item }) => (
                  <View style={{ width: screenWidth, height: "100%" }}>
                    <ExpoImage
                      cachePolicy="memory-disk"
                      contentFit="contain"
                      contentPosition="center"
                      source={getPhotoSource(getPhotoFullUrl(item))}
                      style={{ flex: 1, width: "100%" }}
                      transition={160}
                    />
                    <View style={[styles.photoViewerMeta, { paddingBottom: insets.bottom + 20 }]}>
                      {item.caption ? (
                        <Text style={styles.photoViewerCaption}>{item.caption}</Text>
                      ) : null}
                      <Text style={styles.photoViewerCredit}>
                        {[item.credit, item.license, item.takenOn]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </View>
                  </View>
                )}
              />
              {photoViewerIndex > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("store.previousPhoto", { defaultValue: "Photo précédente" })}
                  onPress={() => {
                    flatListRef.current?.scrollToIndex({ index: photoViewerIndex - 1, animated: true });
                  }}
                  style={styles.galleryArrowLeft}
                >
                  <ChevronLeft color={theme.colors.paper} size={36} />
                </Pressable>
              )}
              {photoViewerIndex < store.photos.length - 1 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("store.nextPhoto", { defaultValue: "Photo suivante" })}
                  onPress={() => {
                    flatListRef.current?.scrollToIndex({ index: photoViewerIndex + 1, animated: true });
                  }}
                  style={styles.galleryArrowRight}
                >
                  <ChevronRight color={theme.colors.paper} size={36} />
                </Pressable>
              )}
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal
        animationType={reduceMotion ? "fade" : "slide"}
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
              <Pressable accessibilityRole="button" accessibilityLabel={t("store.close")} onPress={() => setChangeModalVisible(false)}>
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
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("store.contributorName")}</Text>
                <TextInput
                  onChangeText={setContributorName}
                  placeholder={t("store.contributorNamePlaceholder")}
                  placeholderTextColor={theme.colors.muted}
                  style={styles.input}
                  value={contributorName}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmittingChange }}
                disabled={isSubmittingChange}
                style={[styles.primaryButton, isSubmittingChange && styles.buttonDisabled]}
                onPress={handleSubmitChange}
              >
                <Send color={theme.colors.paper} size={18} />
                <Text style={styles.primaryButtonText}>{t("store.submitCorrection")}</Text>
              </Pressable>
              {renderFeedback(contributionFeedback)}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType={reduceMotion ? "fade" : "slide"}
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
              <Pressable accessibilityRole="button" accessibilityLabel={t("store.close")} onPress={() => setPhotoModalVisible(false)}>
                <X color={theme.colors.ink} size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalSheetContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalIntro}>{t("store.photoHelp")}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: photoPickerOpen }}
                disabled={photoPickerOpen}
                style={[
                  styles.secondaryButton,
                  photoPickerOpen ? styles.buttonDisabled : null
                ]}
                onPress={handlePickPhoto}
              >
                <Camera color={theme.colors.teal} size={18} />
                <Text style={styles.secondaryButtonText}>
                  {photoAsset ? t("store.photoSelected") : t("store.pickPhoto")}
                </Text>
              </Pressable>
              {photoAsset ? (
                <ExpoImage
                  contentFit="cover"
                  source={{ uri: photoAsset.uri }}
                  style={styles.photoPreview}
                />
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
                <Text style={styles.switchLabel}>{t("store.peopleVisible")}</Text>
                <Switch value={peopleVisible} onValueChange={setPeopleVisible} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmittingPhoto }}
                disabled={isSubmittingPhoto}
                style={[styles.primaryButton, isSubmittingPhoto && styles.buttonDisabled]}
                onPress={handleSubmitPhoto}
              >
                <Send color={theme.colors.paper} size={18} />
                <Text style={styles.primaryButtonText}>{t("store.submitPhoto")}</Text>
              </Pressable>
              {renderFeedback(contributionFeedback)}
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
    shareCardCaptureHost: {
      height: 315,
      left: -10000,
      position: "absolute",
      top: 0,
      width: 600
    },
    shareCardCapture: {
      height: 315,
      width: 600
    },
    content: {
      padding: spacing.lg,
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
    missingState: {
      flex: 1,
      gap: spacing.md,
      justifyContent: "center",
      paddingHorizontal: spacing.lg
    },
    hero: {
      gap: spacing.sm
    },
    heroNavRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.xs
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: radii.full
    },
    title: {
      color: colors.ink,
      fontSize: 35,
      fontWeight: "900",
      letterSpacing: 0,
      lineHeight: 39
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
    buttonDisabled: {
      opacity: 0.62
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
      minHeight: 48
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
      fontSize: typography.small,
      fontWeight: "800",
      lineHeight: 20,
      marginTop: spacing.sm
    },
    messageSuccess: {
      color: colors.teal
    },
    messageError: {
      color: colors.danger
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
    architectureSummary: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.md
    },
    architectureBadge: {
      alignItems: "center",
      backgroundColor: colors.mint,
      borderRadius: radii.full,
      height: 34,
      justifyContent: "center",
      width: 34
    },
    architectureCopy: {
      flex: 1,
      gap: spacing.xs
    },
    architectureTitleButton: {
      alignItems: "center",
      alignSelf: "flex-start",
      flexDirection: "row",
      gap: spacing.xs,
      maxWidth: "100%"
    },
    architectureTitle: {
      color: colors.ink,
      flexShrink: 1,
      fontSize: typography.body,
      fontWeight: "900",
      lineHeight: 22
    },
    architectureEraButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.canvas,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs
    },
    architectureEraText: {
      color: colors.muted,
      fontSize: typography.caption,
      fontWeight: "800",
      lineHeight: 16
    },
    attributeChipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.md
    },
    attributeChip: {
      backgroundColor: colors.mint,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    attributeChipActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink
    },
    attributeChipText: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "800"
    },
    attributeChipTextActive: {
      color: colors.paper
    },
    architectureNotes: {
      gap: spacing.sm,
      marginTop: spacing.md
    },
    architectureNoteButton: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      padding: spacing.md
    },
    architectureNote: {
      color: colors.muted,
      fontSize: typography.small,
      lineHeight: 20
    },
    architectureDetailCard: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: spacing.md,
      overflow: "hidden",
      ...shadows.sm
    },
    architectureDetailImage: {
      backgroundColor: colors.line,
      height: 150,
      width: "100%"
    },
    architectureDetailCopy: {
      gap: spacing.sm,
      padding: spacing.md
    },
    architectureDetailTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm
    },
    architectureDetailTitle: {
      color: colors.ink,
      flex: 1,
      fontSize: typography.body,
      fontWeight: "900",
      lineHeight: 22
    },
    architectureDetailBody: {
      color: colors.ink,
      fontSize: typography.small,
      lineHeight: 21
    },
    architectureContextBox: {
      backgroundColor: colors.canvas,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      gap: spacing.xs,
      padding: spacing.md
    },
    architectureContextLabel: {
      color: colors.copper,
      fontSize: typography.caption,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    architectureContextText: {
      color: colors.muted,
      fontSize: typography.small,
      lineHeight: 20
    },
    architectureImageButton: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.mint,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      minHeight: 38,
      paddingHorizontal: spacing.md
    },
    architectureImageButtonText: {
      color: colors.teal,
      fontSize: typography.small,
      fontWeight: "900"
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
    photoSubsectionTitle: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "900",
      letterSpacing: 0,
      marginTop: spacing.md
    },
    photoCard: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: radii.md,
      borderWidth: 1,
      overflow: "hidden",
      width: 280,
      ...shadows.sm
    },
    photoRemoveButton: {
      alignItems: "center",
      backgroundColor: colors.overlay,
      borderRadius: radii.full,
      height: 24,
      justifyContent: "center",
      position: "absolute",
      right: spacing.xs,
      top: spacing.xs,
      width: 24
    },
    photoImage: {
      backgroundColor: colors.line,
      height: 180,
      width: 280
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
      flex: 1
    },
    photoViewerHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      zIndex: 10
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
      flex: 1,
      width: "100%"
    },
    photoViewerMeta: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      padding: spacing.lg,
      paddingTop: spacing.md
    },
    photoViewerCaption: {
      color: colors.paper,
      fontSize: typography.body,
      fontWeight: "800",
      lineHeight: 22
    },
    photoViewerCredit: {
      color: "rgba(255, 255, 255, 0.7)",
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
    privatePhotoButton: {
      marginTop: spacing.md
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
    shareHero: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.sm
    },
    shareHeroCopy: {
      flex: 1,
      gap: spacing.xs
    },
    shareBrandMark: {
      alignItems: "center",
      backgroundColor: colors.ink,
      borderRadius: radii.full,
      height: 46,
      justifyContent: "center",
      width: 46
    },
    shareBrandMarkText: {
      color: colors.paper,
      fontSize: typography.title2,
      fontWeight: "900"
    },
    shareCloseButton: {
      alignItems: "center",
      height: 40,
      justifyContent: "center",
      width: 40
    },
    sharePreview: {
      alignItems: "stretch",
      aspectRatio: 1200 / 630,
      overflow: "hidden"
    },
    shareCardSurface: {
      backgroundColor: shareCardColors.paper,
      borderColor: shareCardColors.line,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      gap: 18,
      overflow: "hidden",
      padding: 24,
      position: "relative"
    },
    shareCardAccent: {
      backgroundColor: shareCardColors.teal,
      height: 7,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0
    },
    shareCardHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8
    },
    shareCardBrandRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10
    },
    shareCardMark: {
      alignItems: "center",
      backgroundColor: shareCardColors.ink,
      borderRadius: 18,
      height: 36,
      justifyContent: "center",
      width: 36
    },
    shareCardMarkText: {
      color: shareCardColors.paper,
      fontSize: 20,
      fontWeight: "900"
    },
    shareCardBrand: {
      color: shareCardColors.teal,
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: 0
    },
    shareCardDate: {
      color: shareCardColors.copper,
      flexShrink: 1,
      fontSize: 13,
      fontWeight: "800",
      textAlign: "right"
    },
    shareCardBody: {
      flex: 1,
      justifyContent: "center"
    },
    shareCardTitle: {
      color: shareCardColors.ink,
      fontSize: 30,
      fontWeight: "900",
      letterSpacing: 0,
      lineHeight: 34
    },
    shareCardPlace: {
      color: shareCardColors.muted,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
      marginTop: 8
    },
    shareCardFooter: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12
    },
    shareCardTagline: {
      color: shareCardColors.ink,
      flexShrink: 1,
      fontSize: 13,
      fontWeight: "800"
    },
    shareCardFooterRule: {
      backgroundColor: shareCardColors.line,
      flex: 1,
      height: 1
    },
    shareGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    shareOption: {
      alignItems: "center",
      backgroundColor: colors.paper,
      borderColor: colors.line,
      borderRadius: 8,
      borderWidth: 1,
      flexBasis: "48%",
      flexGrow: 1,
      gap: spacing.xs,
      minHeight: 82,
      justifyContent: "center",
      padding: spacing.sm
    },
    shareOptionText: {
      color: colors.ink,
      fontSize: typography.small,
      fontWeight: "900",
      textAlign: "center"
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
      gap: spacing.md,
      justifyContent: "space-between"
    },
    switchLabel: {
      color: colors.ink,
      flex: 1,
      flexShrink: 1,
      fontSize: typography.body,
      lineHeight: 23
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
    },

    galleryArrowLeft: {
      position: "absolute",
      left: spacing.lg,
      top: "50%",
      marginTop: -22,
      backgroundColor: "rgba(0,0,0,0.4)",
      borderRadius: radii.full,
      padding: 4,
    },
    galleryArrowRight: {
      position: "absolute",
      right: spacing.lg,
      top: "50%",
      marginTop: -22,
      backgroundColor: "rgba(0,0,0,0.4)",
      borderRadius: radii.full,
      padding: 4,
    }
  }), [colors, radii, shadows, spacing, typography]);
}
