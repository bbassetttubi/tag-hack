import { useEffect, useRef, useState } from "react";
import { Video, ResizeMode } from "expo-av";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import { SpinningBunny } from "./SpinningBunny";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

interface VideoPlayerProps {
  source?: string;
  autoPlay?: boolean;
  isProcessing?: boolean;
  fullScreen?: boolean;
  loop?: boolean;
  muted?: boolean;
  onPlaybackStatusUpdate?: (status: any) => void;
  videoRef?: React.RefObject<Video>;
}

export function VideoPlayer({ 
  source, 
  autoPlay = false, 
  isProcessing = false, 
  fullScreen = false,
  loop = false,
  muted = false,
  onPlaybackStatusUpdate,
  videoRef: externalVideoRef 
}: VideoPlayerProps) {
  const internalVideoRef = useRef<Video | null>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const [playerKey, setPlayerKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) {
      return;
    }
    setPlayerKey((prev) => prev + 1);
    setLoadError(null);
  }, [source]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) {
      return;
    }

    if (autoPlay) {
      // Delay auto-play to ensure native module is ready
      const timer = setTimeout(() => {
        video.playAsync().catch(() => {
          // Silently ignore auto-play errors - video will still be visible and playable
        });
      }, 100);
      return () => clearTimeout(timer);
    } else {
      void video.pauseAsync().catch(() => undefined);
    }
  }, [autoPlay, source]);

  if (!source && isProcessing) {
    return (
      <View style={fullScreen ? styles.fullScreenPlaceholder : styles.placeholder}>
        <SpinningBunny size={100} message="Creating your video..." />
      </View>
    );
  }

  if (!source) {
    return (
      <View style={fullScreen ? styles.fullScreenPlaceholder : styles.placeholder}>
        <Text style={styles.noVideoText}>No video available</Text>
      </View>
    );
  }

  return (
    <View style={fullScreen ? styles.fullScreenContainer : styles.container}>
      <Video
        key={playerKey}
        ref={videoRef as any}
        source={{ uri: source }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={autoPlay}
        isLooping={loop}
        isMuted={muted}
        volume={muted ? 0 : 1.0}
        useNativeControls={!fullScreen}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onError={(err) => {
          console.error("Video playback error", err);
          setLoadError("Unable to play video");
        }}
      />
      {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: "#000000",
  },
  fullScreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000000",
  },
  placeholder: {
    height: 400,
    width: "100%",
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  fullScreenPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  noVideoText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
  },
  errorText: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#ffb400",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});