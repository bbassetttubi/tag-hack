import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, RefreshControl } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { LinearGradient } from "expo-linear-gradient";
import { AppBottomNav, AppNavRoute } from "../components/AppBottomNav";
import { SpinningBunny } from "../components/SpinningBunny";
import { TubiLogo } from "../components/TubiLogo";
import { Video, ResizeMode } from "expo-av";

type Props = NativeStackScreenProps<RootStackParamList, "StoriesFeed">;

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

interface StoryPreview {
  id: string;
  title: string;
  createdBy: string;
  totalDurationSeconds: number;
  segmentCount: number;
  thumbnailUrl?: string;
  firstVideoUrl?: string;
  createdAt: string;
}

export function StoriesFeedScreen({ navigation }: Props) {
  const [stories, setStories] = useState<StoryPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStories = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/feed`);
      if (!response.ok) throw new Error("Failed to fetch stories");
      
      const data = await response.json();
      setStories(data.stories || []);
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleNavChange = (route: AppNavRoute) => {
    if (route === "home") {
      navigation.navigate("StoryHome");
    } else if (route === "create") {
      navigation.navigate("StoryHome");
    } else if (route === "feed") {
      // Already on feed
    }
  };

  const handleStoryPress = (storyId: string) => {
    navigation.navigate("StoryReels", { storyId });
  };

  const renderStoryCard = ({ item }: { item: StoryPreview }) => (
    <TouchableOpacity
      style={styles.storyCard}
      onPress={() => handleStoryPress(item.id)}
      activeOpacity={0.9}
    >
      {/* Video Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {item.firstVideoUrl ? (
          <Video
            source={{ uri: item.firstVideoUrl }}
            style={styles.thumbnail}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted
          />
        ) : (
          <LinearGradient
            colors={['#1a0033', '#0a001a']}
            style={styles.thumbnail}
          >
            <Text style={styles.placeholderIcon}>🎬</Text>
          </LinearGradient>
        )}
        
        {/* Duration badge */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.totalDurationSeconds}s</Text>
        </View>

        {/* Segment count badge */}
        <View style={styles.segmentBadge}>
          <Text style={styles.segmentText}>{item.segmentCount} scenes</Text>
        </View>
      </View>

      {/* Story Info */}
      <View style={styles.storyInfo}>
        <Text style={styles.storyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.creatorName}>@{item.createdBy}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#1a0033', '#0a001a', '#000000']} style={StyleSheet.absoluteFill} />
        <SpinningBunny size={100} message="Loading stories..." />
        <AppBottomNav activeRoute="feed" onChange={handleNavChange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0033', '#0a001a', '#000000']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0)"]}
        style={styles.header}
      >
        <SafeAreaView>
          <TubiLogo width={120} height={35} />
        </SafeAreaView>
      </LinearGradient>

      {/* Stories Grid */}
      <FlatList
        data={stories}
        renderItem={renderStoryCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.feedContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStories(true)}
            tintColor="#ffff13"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyText}>No stories yet</Text>
            <Text style={styles.emptySubtext}>Create the first one!</Text>
          </View>
        }
      />

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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    zIndex: 10,
    alignItems: "center",
  },
  feedContent: {
    padding: 12,
    paddingBottom: 140,
  },
  columnWrapper: {
    gap: 12,
  },
  storyCard: {
    flex: 1,
    maxWidth: (SCREEN_WIDTH - 36) / 2,
    marginBottom: 12,
  },
  thumbnailContainer: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 48,
    opacity: 0.3,
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  segmentBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255, 255, 19, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000000",
  },
  storyInfo: {
    paddingTop: 8,
    gap: 4,
  },
  storyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  creatorName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.5)",
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.3)",
  },
});

