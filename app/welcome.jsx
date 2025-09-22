import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>Reelstagram</Text>
        <View style={styles.gradientLine} />
      </View>
      
      <Text style={styles.title}>Welcome to Reelstagram</Text>
      <Text style={styles.subtitle}>
        Share your moments, discover amazing content, and connect with creators worldwide.
      </Text>
      
      <TouchableOpacity style={styles.getStartedButton} onPress={() => router.push("/login")}>
        <Text style={styles.getStartedButtonText}>Get Started</Text>
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000000",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 8,
  },
  gradientLine: {
    width: 60,
    height: 3,
    backgroundColor: "#E4405F",
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 16,
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E8E",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  getStartedButton: {
    backgroundColor: "#E4405F",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#E4405F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 30,
  },
  getStartedButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    color: "#8E8E8E",
    fontSize: 14,
    marginRight: 8,
  },
  loginLink: {
    color: "#E4405F",
    fontSize: 14,
    fontWeight: "600",
  },
});
