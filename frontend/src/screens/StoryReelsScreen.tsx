import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Dimensions, Keyboard, Modal, Alert, SafeAreaView, PanResponder } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { VideoPlayer } from "../components/VideoPlayer";
import { TagUserModal } from "../components/TagUserModal";
import { SpinningBunny } from "../components/SpinningBunny";
import { useStory, tagUser, clearTag, checkCanContinue, remixSegment as apiRemixSegment } from "../services/api";
import { useSegmentAppend } from "../hooks/useSegmentAppend";
import { RootStackParamList } from "../../App";
import { LinearGradient } from "expo-linear-gradient";
import type { Video } from "expo-av";
import { AppBottomNav, AppNavRoute } from "../components/AppBottomNav";
import Svg, { Path, Circle } from "react-native-svg";

type Props = NativeStackScreenProps<RootStackParamList, "StoryDetail">;

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

// Custom action icons from Figma
const ContinueIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" stroke="#ffffff" strokeWidth="2" fill="none" />
    <Path d="M16 10v12M10 16h12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const RemixIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    {/* Circle outline */}
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 3.2C8.95131 3.2 3.2 8.95131 3.2 16C3.2 23.0487 8.95131 28.8 16 28.8C23.0487 28.8 28.8 23.0487 28.8 16C28.8 8.95131 23.0487 3.2 16 3.2ZM0 16C0 7.1856 7.1856 0 16 0C24.8144 0 32 7.1856 32 16C32 24.8144 24.8144 32 16 32C7.1856 32 0 24.8144 0 16Z"
      fill="#ffffff"
    />
    {/* Down arrow on left */}
    <Path
      d="M9.6004 9.6V17.9008L9.13324 17.4368C8.50756 16.8112 7.49476 16.768 6.86924 17.392C6.24372 18.0176 6.24372 19.0304 6.86924 19.656L9.56516 22.3968C10.6516 23.4832 11.7748 23.4512 12.8164 22.4096L15.5316 19.6944C16.1572 19.0688 16.1572 18.056 15.5316 17.4304C14.906 16.8048 13.8932 16.8048 13.2676 17.4304L12.8004 17.9008V9.6C12.8004 8.7168 12.0836 8 11.2004 8C10.3172 8 9.6004 8.7168 9.6004 9.6Z"
      fill="#ffffff"
    />
    {/* Up arrow on right */}
    <Path
      d="M22.4003 21.6013V13.3004L22.8675 13.7644C23.4931 14.39 24.5059 14.4332 25.1315 13.8092C25.7571 13.1836 25.7571 12.1708 25.1315 11.5452L22.4355 8.80444C21.3491 7.71804 20.2259 7.75004 19.1843 8.79164L16.4691 11.5068C15.8435 12.1324 15.8435 13.1452 16.4691 13.7708C17.0947 14.3964 18.1075 14.3964 18.7331 13.7708L19.2003 13.3004V21.6013C19.2003 22.4845 19.9171 23.2013 20.8003 23.2013C21.6835 23.2013 22.4003 22.4845 22.4003 21.6013Z"
      fill="#ffffff"
    />
  </Svg>
);

const TagIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <Path
      d="M25.04 3.66c0.85-0.34 1.78-0.44 2.69-0.30 1.25 0.24 2.37 0.87 3.16 1.90 0.79 1.03 1.21 2.22 1.16 3.47v13.15c0 3.13-1.26 6.13-3.49 8.33-2.24 2.21-5.27 3.45-8.43 3.45h-4.41c-1.93 0.02-3.84-0.38-5.60-1.16-2.01-0.95-3.68-2.49-4.81-4.40l-3.23-5.31c-0.20-0.33-0.43-0.64-0.68-0.93-0.59-0.67-1.00-1.49-1.19-2.36-0.15-0.73-0.13-1.49 0.05-2.22 0.18-0.73 0.52-1.41 1.00-1.98 0.48-0.58 1.08-1.05 1.77-1.37 0.68-0.32 1.43-0.49 2.19-0.49 0.67 0.003 1.34 0.13 1.96 0.39 0.62 0.26 1.18 0.63 1.66 1.11l3.13 4.77c0.32 0.31 0.50 0.74 0.50 1.19 0 0.44-0.18 0.87-0.50 1.19-0.32 0.31-0.75 0.49-1.20 0.49-0.45 0-0.88-0.18-1.20-0.49l-3.05-4.77c-0.17-0.17-0.37-0.30-0.59-0.39-0.22-0.09-0.46-0.13-0.70-0.12-0.23 0.002-0.45 0.05-0.66 0.13-0.21 0.09-0.39 0.21-0.55 0.37-0.16 0.16-0.29 0.34-0.37 0.55-0.09 0.21-0.13 0.43-0.13 0.65 0 0.22 0.04 0.44 0.13 0.65 0.09 0.21 0.21 0.39 0.37 0.55l3.17 5.36c1.08 1.91 2.71 3.45 4.68 4.45 0.98 0.51 2.06 0.78 3.17 0.77h5.11c2.26 0 4.42-0.89 6.01-2.47 1.60-1.58 2.49-3.73 2.49-5.96v-11.80c0-0.45-0.18-0.87-0.50-1.19-0.32-0.31-0.75-0.49-1.20-0.49-0.45 0-0.88 0.18-1.20 0.49-0.32 0.32-0.50 0.75-0.50 1.19v6.74c0 0.45-0.18 0.87-0.50 1.19-0.32 0.32-0.75 0.49-1.20 0.49-0.45 0-0.88-0.18-1.20-0.49-0.32-0.31-0.50-0.74-0.50-1.19V5.03c0-0.45-0.18-0.88-0.50-1.19-0.32-0.32-0.75-0.49-1.20-0.49-0.45 0-0.88 0.17-1.20 0.49-0.32 0.31-0.50 0.74-0.50 1.19v6.74c0 0.45-0.18 0.87-0.50 1.19-0.32 0.31-0.75 0.49-1.20 0.49-0.45 0-0.88-0.18-1.20-0.49-0.32-0.31-0.50-0.74-0.50-1.19V8.31c0-0.45-0.18-0.87-0.50-1.19-0.32-0.31-0.75-0.49-1.20-0.49-0.45 0-0.88 0.18-1.20 0.49-0.32 0.32-0.50 0.75-0.50 1.19v2.71c0 0.45-0.18 0.87-0.50 1.19-0.32 0.32-0.75 0.49-1.20 0.49-0.45 0-0.88-0.18-1.20-0.49-0.32-0.31-0.50-0.74-0.50-1.19V8.63c-0.04-1.26 0.37-2.49 1.17-3.47 0.79-0.99 1.91-1.66 3.16-1.90 0.91-0.14 1.84-0.04 2.69 0.30 0.31-1.05 0.96-1.97 1.84-2.63 0.88-0.66 1.96-1.01 3.07-1.01 1.11 0 2.18 0.35 3.07 1.01 0.88 0.66 1.53 1.58 1.84 2.63z"
      fill="#ffffff"
    />
  </Svg>
);

export function StoryReelsScreen({ route, navigation }: Props) {
  const { storyId } = route.params;
  const { data, isLoading, error, mutate } = useStory(storyId);
  const [currentUserName, setCurrentUserName] = useState("User");
  const [showTagModal, setShowTagModal] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [promptMode, setPromptMode] = useState<"continue" | "remix">("continue");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<"4" | "6" | "8">("8");
  const [canContinue, setCanContinue] = useState(true);
  const [continueReason, setContinueReason] = useState<string | undefined>();
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0);
  const [remixing, setRemixing] = useState(false);
  const videoRef = useRef<Video>(null);

  const displaySegment = data?.segments[selectedSegmentIndex];
  const latestSegment = data?.segments[data.segments.length - 1];

  // Auto-select first segment when new scenes are added to show progression from start
  useEffect(() => {
    if (data?.segments && data.segments.length > 0) {
      // Start from the beginning to show the full progression
      setSelectedSegmentIndex(0);
    }
  }, [data?.segments?.length]);

  // Swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const minSwipeDistance = 50;
        
        // Swipe left (show next segment)
        if (gestureState.dx < -minSwipeDistance && data?.segments && selectedSegmentIndex < data.segments.length - 1) {
          setSelectedSegmentIndex(selectedSegmentIndex + 1);
        }
        // Swipe right (show previous segment)
        else if (gestureState.dx > minSwipeDistance && selectedSegmentIndex > 0) {
          setSelectedSegmentIndex(selectedSegmentIndex - 1);
        }
      },
    })
  ).current;

  const { submit, loading, error: appendError } = useSegmentAppend(storyId, () => {
    void mutate();
    setPrompt("");
    setShowPromptInput(false);
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
    setShowTagModal(false);
    
    // For demo: switch to tagged user and show prompt
    setCurrentUserName(userName);
    setPromptMode("continue");
    setShowPromptInput(true);
  };

  const handleContinueStory = () => {
    if (!canContinue) {
      Alert.alert('Cannot Continue', continueReason || 'You cannot continue this story');
      return;
    }
    setPromptMode("continue");
    setShowPromptInput(true);
  };

  const handleRemixSegment = () => {
    if (!displaySegment || displaySegment.status !== "completed") {
      Alert.alert('Cannot Remix', 'This segment is not ready for remixing yet');
      return;
    }
    setPromptMode("remix");
    setShowPromptInput(true);
  };

  const handleSubmit = async () => {
    if (!data || !prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    if (promptMode === "continue") {
      await submit({
        prompt,
        creatorName: currentUserName,
        durationSeconds: duration,
        useInputReference: true,
      });
    } else {
      setRemixing(true);
      try {
        await apiRemixSegment(storyId, {
          sourceSegmentId: displaySegment!.id,
          prompt,
          creatorName: currentUserName,
        });
        await mutate();
        setPrompt("");
        setShowPromptInput(false);
        Alert.alert('Success', 'Remix started!');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to remix segment');
      } finally {
        setRemixing(false);
      }
    }
  };

  const remainingSeconds = Math.max(0, 90 - (data?.story.totalDurationSeconds ?? 0));
  const isTagged = Boolean(data?.story.nextContributor);
  const isTaggedUser = data?.story.nextContributor === currentUserName;

  const handlePreviousSegment = () => {
    if (selectedSegmentIndex > 0) {
      setSelectedSegmentIndex(selectedSegmentIndex - 1);
    }
  };

  const handleNextSegment = () => {
    if (data?.segments && selectedSegmentIndex < data.segments.length - 1) {
      setSelectedSegmentIndex(selectedSegmentIndex + 1);
    }
  };

  const handleVideoPlaybackUpdate = useCallback((status: any) => {
    // Auto-advance to next segment when current video finishes
    if (status.didJustFinish && !status.isLooping && data?.segments && data.segments.length > 1) {
      const isLastSegment = selectedSegmentIndex === data.segments.length - 1;
      // If it's the last segment, loop back to the beginning. Otherwise, go to the next one.
      const nextSegmentIndex = isLastSegment ? 0 : selectedSegmentIndex + 1;
      setTimeout(() => {
        setSelectedSegmentIndex(nextSegmentIndex);
      }, 300);
    }
  }, [selectedSegmentIndex, data?.segments]);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleNavChange = (route: AppNavRoute) => {
    if (route === "home") {
      navigation.navigate("StoryHome");
    } else if (route === "create") {
      navigation.navigate("StoryHome");
    } else if (route === "feed") {
      navigation.navigate("StoriesFeed");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SpinningBunny size={100} message="Loading story..." />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error?.message || "Failed to load story"}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Video Player (Full Screen) */}
      <VideoPlayer
        source={displaySegment?.videoUrl}
        autoPlay={true}
        isProcessing={displaySegment?.status === "queued" || displaySegment?.status === "in_progress"}
        fullScreen={true}
        onPlaybackStatusUpdate={handleVideoPlaybackUpdate}
        videoRef={videoRef}
      />

      {/* Left tap zone for previous segment */}
      {selectedSegmentIndex > 0 && (
        <TouchableOpacity
          style={styles.tapZoneLeft}
          onPress={handlePreviousSegment}
          activeOpacity={0.3}
        />
      )}

      {/* Right tap zone for next segment */}
      {data?.segments && selectedSegmentIndex < data.segments.length - 1 && (
        <TouchableOpacity
          style={styles.tapZoneRight}
          onPress={handleNextSegment}
          activeOpacity={0.3}
        />
      )}

      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0)"]}
        style={styles.topGradient}
      >
        <SafeAreaView>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleClose} style={styles.closeIconButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <View style={styles.storyInfo}>
              <Text style={styles.storySubtitle}>
                Segment {selectedSegmentIndex + 1} of {data.segments.length} • {remainingSeconds}s left
              </Text>
            </View>
          </View>
          
        </SafeAreaView>
      </LinearGradient>

      {/* Right Side Action Buttons - Hide while video is generating */}
      {displaySegment?.status === "completed" && (
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={handleContinueStory}
            disabled={remainingSeconds <= 0 || !canContinue}
          >
            <View style={[styles.iconCircle, (!canContinue || remainingSeconds <= 0) && styles.iconDisabled]}>
              <ContinueIcon />
            </View>
            <Text style={styles.actionLabel}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIcon}
            onPress={handleRemixSegment}
            disabled={!displaySegment || displaySegment.status !== "completed"}
          >
            <View style={[styles.iconCircle, (!displaySegment || displaySegment.status !== "completed") && styles.iconDisabled]}>
              <RemixIcon />
            </View>
            <Text style={styles.actionLabel}>Remix</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => setShowTagModal(true)}
            disabled={remainingSeconds <= 0}
          >
            <View style={[styles.iconCircle, remainingSeconds <= 0 && styles.iconDisabled]}>
              <TagIcon />
            </View>
            <Text style={styles.actionLabel}>Tag</Text>
          </TouchableOpacity>

          {isTagged && data.story.nextContributor && (
            <View style={styles.tagIndicator}>
              <Text style={styles.tagIndicatorText}>
                {isTaggedUser ? "Your turn!" : `@${data.story.nextContributor}`}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom Gradient Overlay with creator info */}
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]}
        style={styles.bottomGradient}
      >
        {displaySegment && (
          <View style={styles.bottomInfo}>
            <Text style={styles.creatorName}>@{displaySegment.creatorName}</Text>
            <Text style={styles.segmentPrompt} numberOfLines={3}>
              {displaySegment.prompt}
            </Text>
          </View>
        )}

        {/* Navigation Dots */}
        {data.segments.length > 1 && (
          <View style={styles.segmentDots}>
            {data.segments.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedSegmentIndex(index)}
                style={[
                  styles.dot,
                  index === selectedSegmentIndex && styles.dotActive
                ]}
              />
            ))}
          </View>
        )}
      </LinearGradient>

      {/* Subtle swipe indicator (removed arrows - using swipe gestures) */}

      {/* Prompt Input Modal */}
      <Modal visible={showPromptInput} transparent animationType="slide">
        <View style={styles.promptModal}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowPromptInput(false)}
            activeOpacity={1}
          />
          <View style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <View>
                <Text style={styles.promptTitle}>
                  {promptMode === "continue" ? "Continue the Story" : "Remix This Segment"}
                </Text>
                {promptMode === "continue" && (
                  <Text style={styles.promptSubtitle}>
                    Continuing as @{currentUserName}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowPromptInput(false)}>
                <Text style={styles.promptClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder={
                promptMode === "continue"
                  ? "Describe what happens next..."
                  : "E.g., 'Change to sunset lighting' or 'Add rain'"
              }
              placeholderTextColor="#666666"
              multiline
              numberOfLines={4}
              style={styles.promptInput}
              autoFocus
            />

            {promptMode === "continue" && (
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Duration:</Text>
                <View style={styles.durationButtons}>
                  {(["4", "6", "8"] as const).map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDuration(d)}
                      style={[styles.durationButton, duration === d && styles.durationButtonActive]}
                    >
                      <Text style={[styles.durationButtonText, duration === d && styles.durationButtonTextActive]}>
                        {d}s
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {appendError && <Text style={styles.errorTextSmall}>{appendError}</Text>}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || remixing || !prompt.trim()}
              style={[styles.submitButton, (loading || remixing || !prompt.trim()) && styles.submitButtonDisabled]}
            >
              <Text style={styles.submitButtonText}>
                {loading || remixing ? "Generating..." : "Submit"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tag User Modal */}
      <TagUserModal
        visible={showTagModal}
        onClose={() => setShowTagModal(false)}
        onTag={handleTagUser}
        currentUser={currentUserName}
      />

      {/* Loading Modal */}
      <Modal visible={loading || remixing} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <SpinningBunny size={100} message="Creating your segment..." />
            <Text style={styles.loadingSubtext}>Veo is creating magic ✨</Text>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <AppBottomNav activeRoute="feed" onChange={handleNavChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
    textAlign: "center",
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  segmentProgressBar: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: "#ffff13",
  },
  progressSegmentCompleted: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  closeIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "700",
  },
  storyInfo: {
    flex: 1,
  },
  storySubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  rightActions: {
    position: "absolute",
    right: 12,
    bottom: 280,
    zIndex: 10,
    gap: 20,
    alignItems: "center",
  },
  actionIcon: {
    alignItems: "center",
    gap: 4,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconDisabled: {
    opacity: 0.3,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tagIndicator: {
    backgroundColor: "rgba(255, 56, 92, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
  },
  tagIndicatorText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: 10,
    justifyContent: "flex-end",
    paddingBottom: 140,
    paddingHorizontal: 16,
  },
  bottomInfo: {
    gap: 8,
    marginBottom: 16,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  segmentPrompt: {
    fontSize: 13,
    color: "#ffffff",
    lineHeight: 18,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  segmentDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dotActive: {
    backgroundColor: "#ffffff",
    width: 20,
  },
  tapZoneLeft: {
    position: "absolute",
    left: 0,
    top: 100,
    bottom: 100,
    width: 80,
    zIndex: 5,
  },
  tapZoneRight: {
    position: "absolute",
    right: 80,
    top: 100,
    bottom: 100,
    width: 80,
    zIndex: 5,
  },
  promptModal: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  promptCard: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
  },
  promptSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
  promptClose: {
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.6)",
  },
  promptInput: {
    backgroundColor: "#2a2a2a",
    color: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  durationRow: {
    gap: 8,
  },
  durationLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "600",
  },
  durationButtons: {
    flexDirection: "row",
    gap: 8,
  },
  durationButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  durationButtonActive: {
    backgroundColor: "#ffff13",
  },
  durationButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  durationButtonTextActive: {
    color: "#000000",
  },
  errorTextSmall: {
    fontSize: 12,
    color: "#ff4444",
  },
  submitButton: {
    backgroundColor: "#ffff13",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
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
});

