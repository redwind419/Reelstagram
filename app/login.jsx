import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../utils/firebaseConfig"; // ✅ make sure db is exported in firebaseConfig
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setErrorMessage("");
    try {
      // 🔹 Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔹 Fetch role from Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // ✅ Redirect to home screen after login
        router.replace("/");
      } else {
        setErrorMessage("User profile not found in database.");
      }
    } catch (error) {
      if (
        error.code === "auth/invalid-email" ||
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setErrorMessage("Invalid email or password.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMessage("Too many attempts. Try again later.");
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>Reelstagram</Text>
        <View style={styles.gradientLine} />
      </View>
      
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8E8E8E"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8E8E8E"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.signupButton} onPress={() => router.push("/signup")}>
          <Text style={styles.signupButtonText}>Create New Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/")}>
          <Text style={styles.backButtonText}>Back</Text>
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
    backgroundColor: "#000000",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 8,
  },
  gradientLine: {
    width: 50,
    height: 3,
    backgroundColor: "#E4405F",
    borderRadius: 2,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1C1C1E",
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E8E",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2C2C2E",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#000000",
    color: "#FFFFFF",
  },
  loginButton: {
    backgroundColor: "#E4405F",
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#E4405F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2C2C2E",
  },
  dividerText: {
    color: "#8E8E8E",
    paddingHorizontal: 16,
    fontSize: 14,
  },
  signupButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2C2C2E",
    marginBottom: 12,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#8E8E8E",
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: "#FF453A",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },
});
