import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, Dimensions, SafeAreaView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SpinningBunny } from "../components/SpinningBunny";
import { TubiLogo } from "../components/TubiLogo";
import { VideoPlayer } from "../components/VideoPlayer";
import { useStoryCreation } from "../hooks/useStoryCreation";
import { RootStackParamList } from "../../App";
import { CreateStoryPayload } from "../types";
import { LinearGradient } from "expo-linear-gradient";
import { useStory } from "../services/api";
import { AppBottomNav, AppNavRoute } from "../components/AppBottomNav";

type Props = NativeStackScreenProps<RootStackParamList, "StoryHome">;

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

// Hero background video story ID - Halloween costume bunnies (Dracula, King Kong, Spider, Mummy) - FRESH
const HERO_STORY_ID = "a3XqxUGJlG1jMm3j9ekn";

const defaultPrompts = [
  "A person in a pointy hat soars through the sky on a magical broom under the full moon.",
  "A group of friendly creatures start a music band in a spooky old mansion.",
  "A playful black cat chases fireflies and dreams of reaching the glowing moon.",
];

const DURATION_OPTIONS: ("4" | "6" | "8")[] = ["4", "6", "8"];

export function StoryHomeScreen({ navigation }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("Tubi Tales");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<"4" | "6" | "8">("8");

  // Fetch hero background video with auto-refresh to prevent URL expiry
  const { data: heroData } = useStory(HERO_STORY_ID, {
    refreshInterval: 600000, // Refresh every 10 minutes (URLs expire after 15 min)
    revalidateOnFocus: true,
  });
  const heroVideoUrl = heroData?.segments?.[0]?.status === "completed" ? heroData.segments[0].videoUrl : undefined;

  const { submit, loading, error } = useStoryCreation((storyId) => {
    navigation.navigate("StoryReels", { storyId });
  });

  const handleCreateStory = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt for your story');
      return;
    }
    
    setShowCreateModal(false); // Close modal immediately
    
    const payload: CreateStoryPayload = {
      title,
      prompt,
      creatorName: "You",
      durationSeconds: duration,
    };
    
    try {
      await submit(payload);
      // Navigation happens in the onSuccess callback
    } catch (err) {
      // Error already set by the hook
      Alert.alert('Error', error || 'Failed to create story');
    }
  };

  const handleQuickPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
    setShowCreateModal(true);
  };

  const handleNavChange = (route: AppNavRoute) => {
    if (route === "home") {
      // Already on home
    } else if (route === "create") {
      setShowCreateModal(true);
    } else if (route === "feed") {
      navigation.navigate("StoriesFeed");
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Background - Gradient with orbs */}
      <LinearGradient
        colors={['#1a0033', '#0a001a', '#000000']}
        style={styles.heroBackground}
      >
        {/* Animated orbs in background */}
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </LinearGradient>
      
      {/* Hero video as overlay */}
      {heroVideoUrl && (
        <VideoPlayer
          source={heroVideoUrl}
          autoPlay={true}
          fullScreen={true}
          loop={true}
          muted={true}
        />
      )}
      
      {/* Dark overlay for readability */}
      <View style={styles.darkOverlay} />

      {/* Top gradient overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0)"]}
        style={styles.topGradient}
      >
        <SafeAreaView>
          <View style={styles.topBar}>
            <TubiLogo width={75} height={22} />
            <Text style={styles.talesText}>Tales</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Bottom Content */}
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.9)"]}
        style={styles.bottomGradient}
      >
        <View style={styles.bottomContent}>
          <Text style={styles.heroTitle}>Start Your Story</Text>
          <Text style={styles.heroSubtitle}>Choose a prompt or create your own</Text>
          
          {/* Quick prompt cards */}
          <View style={styles.quickPromptsContainer}>
            {defaultPrompts.map((promptText, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickPromptCard}
                onPress={() => handleQuickPrompt(promptText)}
              >
                <Text style={styles.quickPromptNumber}>{index + 1}</Text>
                <Text style={styles.quickPromptText} numberOfLines={2}>
                  {promptText}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Create button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>✨ Create Your Own</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Create Story Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowCreateModal(false)}
            activeOpacity={1}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Your Story</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Story title"
              placeholderTextColor="#666666"
              style={styles.titleInput}
            />

            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Describe your opening scene..."
              placeholderTextColor="#666666"
              multiline
              numberOfLines={4}
              style={styles.promptInput}
              autoFocus
            />

            <View style={styles.durationRow}>
              <Text style={styles.durationLabel}>Duration:</Text>
              <View style={styles.durationButtons}>
                {DURATION_OPTIONS.map((d) => (
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

            {error && <Text style={styles.errorTextSmall}>{error}</Text>}

            <TouchableOpacity
              onPress={handleCreateStory}
              disabled={loading || !prompt.trim()}
              style={[styles.submitButton, (loading || !prompt.trim()) && styles.submitButtonDisabled]}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Generating..." : "Create Story"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <AppBottomNav activeRoute="home" onChange={handleNavChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  heroBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 0,
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 2,
  },
  orb1: {
    position: "absolute",
    top: 100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(138, 43, 226, 0.2)",
    opacity: 0.6,
  },
  orb2: {
    position: "absolute",
    top: 300,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(75, 0, 130, 0.15)",
    opacity: 0.5,
  },
  orb3: {
    position: "absolute",
    bottom: 100,
    left: 50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 19, 0.1)",
    opacity: 0.4,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 10,
  },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 88,
    alignItems: "center",
    zIndex: 20,
    gap: 4,
  },
  talesText: {
    fontSize: 20,
    fontStyle: "italic",
    fontWeight: "300",
    color: "#ffffff",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
    zIndex: 10,
    justifyContent: "flex-end",
    paddingBottom: 120,
  },
  bottomContent: {
    paddingHorizontal: 24,
    gap: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 8,
  },
  quickPromptsContainer: {
    gap: 12,
  },
  quickPromptCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  quickPromptNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffff13",
    width: 40,
    textAlign: "center",
  },
  quickPromptText: {
    flex: 1,
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(138, 43, 226, 0.6)",
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalCard: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
  },
  modalClose: {
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.6)",
  },
  titleInput: {
    backgroundColor: "#2a2a2a",
    color: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
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
});