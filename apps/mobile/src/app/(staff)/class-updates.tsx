import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontFamilies } from "@/constants/theme";

export default function StaffClassUpdatesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Class Updates</Text>
        <Text style={styles.subtitle}>Post updates and notes for parents</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 28,
    color: "#1f2937",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
  },
});
