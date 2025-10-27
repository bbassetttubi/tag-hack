import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface TabsProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export function Tabs({ tabs, activeIndex, onChange }: TabsProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => {
        const active = index === activeIndex;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onChange(index)}
            style={[styles.tab, active && styles.activeTab]}
          >
            <Text style={[styles.tabText, active && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#161324",
    borderRadius: 999,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#ffff13",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  activeTabText: {
    color: "#0b0019",
  },
});