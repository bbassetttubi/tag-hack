import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
  title: string;
  actionLabel?: string;
}

export function Header({ title, actionLabel }: HeaderProps) {
  const insets = useSafeAreaInsets();

  const dynamicPaddingTop = Math.max(insets.top, 24);

  return (
    <View style={[styles.container, { paddingTop: dynamicPaddingTop }] }>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {actionLabel ? <Text style={styles.action}>{actionLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    justifyContent: "flex-end",
    backgroundColor: "rgba(11, 0, 25, 0.75)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
  },
  action: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
});