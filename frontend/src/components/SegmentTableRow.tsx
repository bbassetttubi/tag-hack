import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { StorySegment } from "../types";
import { SpinningBunny } from "./SpinningBunny";

interface SegmentTableRowProps {
  segment: StorySegment;
  index: number;
  onPress: () => void;
}

export function SegmentTableRow({ segment, index, onPress }: SegmentTableRowProps) {
  const isProcessing = segment.status === "queued" || segment.status === "in_progress";
  
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.indexCell}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
      
      <View style={styles.creatorCell}>
        <Text style={styles.creatorText} numberOfLines={1}>
          {segment.creatorName}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.durationText}>{segment.durationSeconds}s</Text>
          {segment.generator ? (
            <View style={[styles.generatorBadge, segment.generator === "veo" ? styles.generatorBadgeVeo : styles.generatorBadgeSora]}>
              <Text style={[styles.generatorText, segment.generator === "veo" ? styles.generatorTextDark : styles.generatorTextLight]}>
                {segment.generator === "veo" ? "Veo" : "Sora"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      
      <View style={styles.videoCell}>
        {segment.thumbnailUrl ? (
          <Image source={{ uri: segment.thumbnailUrl }} style={styles.thumbnail} />
        ) : isProcessing ? (
          <View style={styles.processingCell}>
            <SpinningBunny size={32} message="" />
          </View>
        ) : (
          <View style={styles.failedCell}>
            <Text style={styles.failedText}>Failed</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  indexCell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 19, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffff13',
  },
  creatorCell: {
    flex: 1,
    gap: 4,
  },
  creatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  durationText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  generatorBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  generatorBadgeSora: {
    backgroundColor: "rgba(255, 255, 19, 0.2)",
  },
  generatorBadgeVeo: {
    backgroundColor: "rgba(103, 232, 249, 0.2)",
  },
  generatorText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  generatorTextLight: {
    color: "#ffff13",
  },
  generatorTextDark: {
    color: "#0b0019",
  },
  videoCell: {
    width: 80,
    height: 45,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  processingCell: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedCell: {
    flex: 1,
    backgroundColor: 'rgba(232, 0, 71, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedText: {
    fontSize: 10,
    color: '#e80047',
    fontWeight: '600',
  },
});

