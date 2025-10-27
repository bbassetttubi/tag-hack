import { useMemo, useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StyleSheet, Alert, Modal } from "react-native";
import useSWR from "swr";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GradientBackground } from "../components/GradientBackground";
import { Header } from "../components/Header";
import { SegmentTableRow } from "../components/SegmentTableRow";
import { VideoPlayer } from "../components/VideoPlayer";
import { TagUserModal } from "../components/TagUserModal";
import { SpinningBunny } from "../components/SpinningBunny";
import { BottomNav, BottomNavRoute } from "../components/BottomNav";
import { useStory, tagUser, clearTag, checkCanContinue, remixSegment as apiRemixSegment, getCombinedVideo } from "../services/api";
import { useSegmentAppend } from "../hooks/useSegmentAppend";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "StoryDetail">;

const DURATION_OPTIONS: ("4" | "6" | "8")[] = ["4", "6", "8"];

const ACTION_GAP = 12;

export function StoryDetailScreen({ route, navigation }: Props) {
  const { storyId } = route.params;
  const { data, isLoading, error, mutate } = useStory(storyId);
  const [currentUserName, setCurrentUserName] = useState("User");
  const [showTagModal, setShowTagModal] = useState(false);
  const [showContinueForm, setShowContinueForm] = useState(false);
  const [showRemixForm, setShowRemixForm] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<"4" | "6" | "8">("8");
  const [canContinue, setCanContinue] = useState(true);
  const [continueReason, setContinueReason] = useState<string | undefined>();
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0);
  const [remixing, setRemixing] = useState(false);
  const [combinedVideoUrl, setCombinedVideoUrl] = useState<string | undefined>();
  const [showCombined, setShowCombined] = useState(true);

  const latestSegment = useMemo(() => data?.segments[data.segments.length - 1], [data]);
  const displaySegment = useMemo(() => {
    if (!data?.segments) return undefined;
    return data.segments[selectedSegmentIndex] ?? latestSegment;
  }, [data?.segments, selectedSegmentIndex, latestSegment]);

  // Auto-select latest segment when new ones are added
  useEffect(() => {
    if (data?.segments && data.segments.length > 0) {
      setSelectedSegmentIndex(data.segments.length - 1);
    }
  }, [data?.segments?.length]);

  const { data: combinedData, isValidating: combinedValidating, error: combinedErr } = useSWR(
    storyId && data?.segments?.length ? ["combined", storyId] : null,
    () => getCombinedVideo(storyId),
    {
      refreshInterval: 15000,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (combinedData?.videoUrl) {
      setCombinedVideoUrl(combinedData.videoUrl);
      setShowCombined(true);
    }
  }, [combinedData?.videoUrl]);

  useEffect(() => {
    if (!data?.segments?.length) {
      setCombinedVideoUrl(undefined);
      setShowCombined(false);
      return;
    }

    if (!combinedData?.videoUrl && latestSegment?.videoUrl) {
      setShowCombined(false);
    }
  }, [data?.segments?.length, combinedData?.videoUrl, latestSegment?.videoUrl]);

  const { submit, loading, error: appendError } = useSegmentAppend(storyId, () => {
    void mutate();
    setPrompt("");
    setShowContinueForm(false);
  });

  useEffect(() => {
    const checkPermissions = async () => {
      if (!data?.story) return;
      try {
        const result = await checkCanContinue(storyId, currentUserName);
        setCanContinue(result.canContinue);
        setContinueReason(result.reason);
      } catch (err) {
        console.error('Failed to check permissions:', err);
      }
    };
    checkPermissions();
  }, [data?.story, storyId, currentUserName]);

  const handleTagUser = async (userName: string) => {
    await tagUser(storyId, {
      nextContributor: userName,
      taggedBy: currentUserName,
    });
    await mutate();
  };

  const handleClearTag = async () => {
    try {
      await clearTag(storyId);
      await mutate();
      Alert.alert('Success', 'Tag cleared - anyone can continue now');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to clear tag');
    }
  };

  const handleContinueStory = async () => {
    if (!canContinue) {
      Alert.alert('Cannot Continue', continueReason || 'You cannot continue this story');
      return;
    }
    setShowContinueForm(true);
  };

  const handleSubmitSegment = async () => {
    if (!data || !prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt for your segment');
      return;
    }
    // Continue the story with a new segment, using last frame as input reference
    await submit({
      prompt,
      creatorName: currentUserName,
      durationSeconds: duration,
      useInputReference: true,
    });
  };

  const handleRemixSegment = async () => {
    if (!data || !prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt for your remix');
      return;
    }

    setRemixing(true);
    try {
      await apiRemixSegment(storyId, {
        sourceSegmentId: displaySegment!.id,
        prompt,
        creatorName: currentUserName,
      });
      await mutate();
      setPrompt("");
      setShowRemixForm(false);
      Alert.alert('Success', 'Remix started! This will create a variation of the selected segment.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remix segment');
    } finally {
      setRemixing(false);
    }
  };

  const remainingSeconds = Math.max(0, 90 - (data?.story.totalDurationSeconds ?? 0));
  const isTagged = Boolean(data?.story.nextContributor);
  const isTaggedUser = data?.story.nextContributor === currentUserName;

  const handleStartNewStory = () => {
    navigation.reset({ index: 0, routes: [{ name: "StoryHome" }] });
  };

  const handleNavChange = (route: BottomNavRoute) => {
    if (route === "home") {
      handleStartNewStory();
      return;
    }
    Alert.alert("Coming soon", "That section will be available in a future release.");
  };

  return (
    <GradientBackground>
      <Header title={data?.story.title ?? "Story"} actionLabel={`${data?.story.totalDurationSeconds ?? 0}/90s`} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.mainContent}>
            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
            {isLoading ? <Text style={styles.loadingText}>Loading...</Text> : null}

            <VideoPlayer
              source={showCombined ? combinedVideoUrl ?? displaySegment?.videoUrl : displaySegment?.videoUrl}
              autoPlay={showCombined}
              isProcessing={(showCombined && combinedValidating) || (!showCombined && (displaySegment?.status === "queued" || displaySegment?.status === "in_progress"))}
            />
            {combinedErr ? <Text style={styles.warningText}>{combinedErr.message ?? String(combinedErr)}</Text> : null}
            {!showCombined && combinedVideoUrl ? (
              <TouchableOpacity style={styles.fullStoryButton} onPress={() => setShowCombined(true)}>
                <Text style={styles.fullStoryButtonText}>View Full Story</Text>
              </TouchableOpacity>
            ) : null}

            {/* Tagged User Banner */}
            {isTagged && data?.story.nextContributor && (
              <View style={styles.tagBanner}>
                <Text style={styles.tagBannerText}>
                  🏷️ {data.story.taggedBy} tagged {data.story.nextContributor}
                </Text>
                {isTaggedUser && (
                  <Text style={styles.tagBannerSubtext}>It's your turn!</Text>
                )}
                {data.story.taggedBy === currentUserName && (
                  <TouchableOpacity onPress={handleClearTag} style={styles.clearTagButton}>
                    <Text style={styles.clearTagButtonText}>Clear Tag</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.segmentsSection}>
              <Text style={styles.sectionTitle}>Chain Progress</Text>
              <View style={styles.tableContainer}>
                {data?.segments.map((segment, index) => (
                  <SegmentTableRow
                    key={segment.id}
                    segment={segment}
                    index={index}
                    onPress={() => {
                      setSelectedSegmentIndex(index);
                      setShowCombined(false);
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            {!showContinueForm && !showRemixForm && data?.story.status === "open" && (
              <View style={styles.actionCard}>
                <Text style={styles.cardTitle}>What's Next?</Text>
                <Text style={styles.remainingText}>Remaining time: {remainingSeconds}s</Text>

                <TouchableOpacity
                  onPress={handleContinueStory}
                  disabled={remainingSeconds <= 0 || !canContinue}
                  style={[styles.actionButton, styles.continueButton, (!canContinue || remainingSeconds <= 0) && styles.buttonDisabled]}
                >
                  <Text style={[styles.actionButtonText, styles.continueButtonText]}>
                    {isTaggedUser ? "✨ Continue Your Turn" : "➕ Continue Story"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowRemixForm(true)}
                  disabled={!displaySegment || displaySegment.status !== "completed"}
                  style={[styles.actionButton, styles.remixButton, (!displaySegment || displaySegment.status !== "completed") && styles.buttonDisabled]}
                >
                  <Text style={styles.actionButtonText}>🎨 Remix This Segment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowTagModal(true)}
                  disabled={remainingSeconds <= 0}
                  style={[styles.actionButton, styles.tagButton, remainingSeconds <= 0 && styles.buttonDisabled]}
                >
                  <Text style={styles.actionButtonText}>🏷️ Tag Someone</Text>
                </TouchableOpacity>

                {!canContinue && continueReason && (
                  <Text style={styles.warningText}>{continueReason}</Text>
                )}
              </View>
            )}

            {/* Continue Form */}
            {showContinueForm && (
              <View style={styles.formCard}>
                <Text style={styles.cardTitle}>Continue the Story</Text>
                <Text style={styles.helperText}>
                  The last frame will be used as the first frame for continuity ✨
                </Text>
                <TextInput
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="Describe what happens next..."
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.multilineInput]}
                />
                <View style={styles.durationPicker}>
                  <Text style={styles.durationLabel}>Duration:</Text>
                  <View style={styles.durationOptions}>
                    {DURATION_OPTIONS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => setDuration(d)}
                        style={[styles.durationButton, duration === d && styles.durationButtonActive]}
                      >
                        <Text style={[styles.durationButtonText, duration === d && styles.durationButtonTextActive]}>{d}s</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {appendError ? <Text style={styles.errorText}>{appendError}</Text> : null}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={() => setShowContinueForm(false)}
                    style={[styles.button, styles.cancelButton]}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmitSegment}
                    disabled={loading}
                    style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                  >
                    <Text style={styles.buttonText}>{loading ? "Generating..." : "Submit"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Remix Form */}
            {showRemixForm && displaySegment && (
              <View style={styles.formCard}>
                <Text style={styles.cardTitle}>Remix This Segment</Text>
                <Text style={styles.helperText}>
                  Make a targeted change to segment #{selectedSegmentIndex + 1} 🎨
                </Text>
                <TextInput
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="E.g., 'Change lighting to golden hour' or 'Add rain'"
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.multilineInput]}
                />
                {appendError ? <Text style={styles.errorText}>{appendError}</Text> : null}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={() => setShowRemixForm(false)}
                    style={[styles.button, styles.cancelButton]}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemixSegment}
                    disabled={remixing}
                    style={[styles.button, styles.submitButton, remixing && styles.buttonDisabled]}
                  >
                    <Text style={styles.buttonText}>{remixing ? "Remixing..." : "Remix"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity onPress={handleStartNewStory} style={styles.newStoryButton}>
              <Text style={styles.newStoryButtonText}>Start a New Story</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <BottomNav activeRoute="scenes" onChange={handleNavChange} />
      </KeyboardAvoidingView>

      <TagUserModal
        visible={showTagModal}
        onClose={() => setShowTagModal(false)}
        onTag={handleTagUser}
        currentUser={currentUserName}
      />

      {/* Loading Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <SpinningBunny size={100} message="Generating your segment..." />
            <Text style={styles.loadingSubtext}>Veo is creating magic ✨</Text>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: "space-between",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },
  errorText: {
    fontSize: 14,
    color: "#ff4444",
  },
  loadingText: {
    fontSize: 14,
    color: "#ffffff",
  },
  warningText: {
    fontSize: 14,
    color: "#ff9800",
    textAlign: "center",
  },
  tagBanner: {
    backgroundColor: "rgba(255, 56, 92, 0.15)",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 56, 92, 0.3)",
  },
  tagBannerText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  tagBannerSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  clearTagButton: {
    backgroundColor: "rgba(255, 56, 92, 0.3)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  clearTagButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  segmentsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
  },
  tableContainer: {
    gap: 0,
  },
  actionCard: {
    backgroundColor: "rgba(11, 0, 25, 0.75)",
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueButton: {
    backgroundColor: "#ffff13",
  },
  continueButtonText: {
    color: "#0b0019",
  },
  remixButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  tagButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  formCard: {
    backgroundColor: "rgba(11, 0, 25, 0.75)",
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
  },
  remainingText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  helperText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#1e1233",
    color: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  multilineInput: {
    height: 96,
    textAlignVertical: "top",
  },
  durationPicker: {
    gap: 4,
  },
  durationLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  durationOptions: {
    flexDirection: "row",
    gap: 4,
  },
  durationButton: {
    backgroundColor: "#1e1233",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 44,
    alignItems: "center",
  },
  durationButtonActive: {
    backgroundColor: "#ffff13",
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  durationButtonTextActive: {
    color: "#0b0019",
  },
  buttonRow: {
    flexDirection: "row",
    gap: ACTION_GAP,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#2a2a2a",
  },
  submitButton: {
    backgroundColor: "#ffff13",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0b0019",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  newStoryButton: {
    marginTop: ACTION_GAP,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(11, 0, 25, 0.6)",
    paddingVertical: 14,
    alignItems: "center",
  },
  newStoryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    backgroundColor: "rgba(11, 0, 25, 0.95)",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  loadingSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  fullStoryButton: {
    marginTop: 12,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 19, 0.2)",
  },
  fullStoryButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffff13",
  },
});