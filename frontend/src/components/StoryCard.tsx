import { Text, View, Image, Pressable, StyleSheet } from "react-native";
import { StorySegment } from "../types";
import { SpinningBunny } from "./SpinningBunny";

interface StoryCardProps {
  segment: StorySegment;
  onPress?: () => void;
}

export function StoryCard({ segment, onPress }: StoryCardProps) {
  const isProcessing = segment.status === "queued" || segment.status === "in_progress";
  
  return (
    <Pressable style={styles.container} onPress={onPress} disabled={!onPress}>
      <View style={styles.thumbnail}>
        {segment.thumbnailUrl ? (
          <Image source={{ uri: segment.thumbnailUrl }} style={styles.image} />
        ) : isProcessing ? (
          <View style={styles.placeholderView}>
            <SpinningBunny size={48} message={segment.status === "queued" ? "Queued..." : "Generating..."} />
          </View>
        ) : (
          <View style={styles.placeholderView}>
            <Text style={styles.statusText}>{segment.status}</Text>
          </View>
        )}
      </View>
      <View style={styles.metadata}>
        <View style={styles.textContainer}>
          <Text numberOfLines={1} style={styles.creatorName}>
            {segment.creatorName}
          </Text>
          <Text numberOfLines={2} style={styles.prompt}>
            {segment.prompt}
          </Text>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{segment.durationSeconds}s</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 314,
  },
  thumbnail: {
    height: 176,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderView: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 14,
    color: "#ffffff",
  },
  metadata: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  prompt: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  durationBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  durationText: {
    fontSize: 12,
    color: "#ffffff",
  },
});