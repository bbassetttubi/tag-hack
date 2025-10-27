import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type BottomNavRoute = "home" | "explore" | "scenes" | "live" | "account";

interface BottomNavProps {
  activeRoute: BottomNavRoute;
  onChange: (route: BottomNavRoute) => void;
}

const ICONS: Record<BottomNavRoute, string> = {
  home: "https://www.figma.com/api/mcp/asset/5d4da1ef-52b8-4e91-9b9f-cc8a70037c31",
  explore: "https://www.figma.com/api/mcp/asset/7da47907-5643-4e04-8082-887f583a14ea",
  scenes: "https://www.figma.com/api/mcp/asset/9cc9ea5b-1081-4266-b4bc-6127cec5af55",
  live: "https://www.figma.com/api/mcp/asset/a7c7b65c-750f-4c5f-8e9d-0b88ba66d9d3",
  account: "https://www.figma.com/api/mcp/asset/2a8abda0-5a3b-4b5c-9e59-8f534c5d17c1",
};

const NAV_ITEMS: Array<{ key: BottomNavRoute; label: string }> = [
  { key: "home", label: "Home" },
  { key: "explore", label: "Explore" },
  { key: "scenes", label: "Scenes" },
  { key: "live", label: "Live TV" },
  { key: "account", label: "My Stuff" },
];

export function BottomNav({ activeRoute, onChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.container, { paddingBottom }]}
    >
      <View style={styles.iconRow}>
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeRoute;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navItem}
              accessibilityRole="button"
              accessibilityState={active ? { selected: true } : undefined}
              onPress={() => onChange(item.key)}
            >
              <View style={[styles.iconWrapper, active && styles.iconWrapperActive]}>
                <Image
                  source={{ uri: ICONS[item.key] }}
                  style={[styles.icon, { tintColor: active ? "#ffff13" : "rgba(255, 255, 255, 0.6)" }]}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#161324",
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  iconWrapperActive: {
    backgroundColor: "rgba(255, 255, 19, 0.2)",
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  labelActive: {
    color: "#ffff13",
  },
});

