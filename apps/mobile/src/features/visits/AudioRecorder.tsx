import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/useAppTheme';

export function AudioRecorder({ audioUri, setAudioUri, readOnly = false }: { audioUri: string | null, setAudioUri?: (uri: string | null) => void, readOnly?: boolean }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles(theme);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer(audioUri || null);

  async function startRecording() {
    try {
      await requestRecordingPermissionsAsync();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  function stopRecording() {
    recorder.stop();
    if (setAudioUri && recorder.uri) setAudioUri(recorder.uri);
  }

  if (audioUri) {
    return (
      <View style={styles.container}>
        <Pressable onPress={() => player.playing ? player.pause() : player.play()} style={styles.button}>
          {player.playing ? <Pause color={theme.colors.paper} size={18} /> : <Play color={theme.colors.paper} size={18} />}
          <Text style={styles.buttonText}>{t("store.audio.play", { defaultValue: "Écouter la note" })}</Text>
        </Pressable>
        {!readOnly && setAudioUri && (
          <Pressable onPress={() => setAudioUri(null)} style={styles.iconButton}>
            <Trash2 color={theme.colors.danger} size={18} />
          </Pressable>
        )}
      </View>
    );
  }

  if (readOnly) return null;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={recorderState.isRecording ? stopRecording : startRecording}
        style={[styles.button, recorderState.isRecording && styles.recordingButton]}
      >
        {recorderState.isRecording ? <Square color={theme.colors.paper} size={18} /> : <Mic color={theme.colors.paper} size={18} />}
        <Text style={styles.buttonText}>
          {recorderState.isRecording ? t("store.audio.stop", { defaultValue: "Arrêter l'enregistrement" }) : t("store.audio.record", { defaultValue: "Ajouter une note vocale" })}
        </Text>
      </Pressable>
    </View>
  );
}

function useStyles(theme: ReturnType<typeof useAppTheme>) {
  return React.useMemo(() => StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.ink,
      paddingVertical: 12,
      borderRadius: theme.radii.md,
      gap: theme.spacing.sm,
    },
    recordingButton: {
      backgroundColor: theme.colors.danger,
    },
    buttonText: {
      color: theme.colors.paper,
      fontSize: theme.typography.small,
      fontWeight: "700",
    },
    iconButton: {
      padding: 12,
      backgroundColor: theme.colors.paper,
      borderWidth: 1,
      borderColor: theme.colors.line,
      borderRadius: theme.radii.md,
      alignItems: "center",
      justifyContent: "center"
    }
  }), [theme]);
}
