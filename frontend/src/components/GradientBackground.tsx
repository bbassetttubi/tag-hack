import { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

interface GradientBackgroundProps {
  children: ReactNode;
}

export function GradientBackground({ children }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={["#53008b", "#0b0019"]}
      style={styles.container}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});