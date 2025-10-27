import { View, TouchableOpacity, StyleSheet, Text, Platform } from "react-native";
import { BlurView } from "expo-blur";
import Svg, { Path } from "react-native-svg";

export type AppNavRoute = "home" | "create" | "feed";

interface AppBottomNavProps {
  activeRoute: AppNavRoute;
  onChange: (route: AppNavRoute) => void;
}

// SVG Icons matching Tubi design
const HomeIcon = ({ active }: { active: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"
      fill={active ? "#ffff13" : "#bfbfbf"}
    />
  </Svg>
);

const TalesIcon = ({ active }: { active: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6h16v12H4V6zm2 2v8h12V8H6z"
      fill={active ? "#ffff13" : "#bfbfbf"}
    />
    <Path
      d="M10 9l5 3-5 3V9z"
      fill={active ? "#ffff13" : "#bfbfbf"}
    />
  </Svg>
);

export function AppBottomNav({ activeRoute, onChange }: AppBottomNavProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <View style={styles.navBar}>
          {/* Home */}
          <TouchableOpacity style={styles.navItem} onPress={() => onChange("home")}>
            <View style={[styles.iconWrapper, activeRoute === "home" && styles.iconWrapperActive]}>
              <HomeIcon active={activeRoute === "home"} />
            </View>
            <Text style={[styles.label, activeRoute === "home" && styles.labelActive]}>Home</Text>
          </TouchableOpacity>

          {/* Create (Center) */}
          <TouchableOpacity style={styles.navItem} onPress={() => onChange("create")}>
            <View style={styles.createIconWrapper}>
              <Text style={styles.createIcon}>+</Text>
            </View>
            <Text style={styles.label}>Create</Text>
          </TouchableOpacity>

          {/* Tubi Tales (Feed) */}
          <TouchableOpacity style={styles.navItem} onPress={() => onChange("feed")}>
            <View style={[styles.iconWrapper, activeRoute === "feed" && styles.iconWrapperActive]}>
              <TalesIcon active={activeRoute === "feed"} />
            </View>
            <Text style={[styles.label, activeRoute === "feed" && styles.labelActive]}>Tubi Tales</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurContainer: {
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    paddingTop: 16,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  navItem: {
    alignItems: "center",
    gap: 1,
    minWidth: 70,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperActive: {
    backgroundColor: "rgba(255, 255, 19, 0.1)",
    borderRadius: 100,
    width: 52,
    height: 28,
  },
  createIconWrapper: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 6,
  },
  createIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: "#bfbfbf",
    marginTop: -2,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "#bfbfbf",
    marginTop: 2,
  },
  labelActive: {
    color: "#ffff13",
    fontWeight: "700",
  },
});

