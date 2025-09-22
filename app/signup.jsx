import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../utils/firebaseConfig";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // renamed from displayName
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignup = async () => {
    setErrorMessage("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        username: username.trim(),   // changed field
        profileImage: null,          // placeholder, can change later
        createdAt: new Date(),
      });

      router.replace("/login"); 
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("This email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("Password must be at least 6 characters.");
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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the Reelstagram community</Text>

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

        {/* new username */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#8E8E8E"
          value={username}
          onChangeText={setUsername}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          <Text style={styles.signupButtonText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/login")}>
          <Text style={styles.loginButtonText}>Already have an account? Sign In</Text>
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
  signupButton: {
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
  signupButtonText: {
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
  loginButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2C2C2E",
    marginBottom: 12,
  },
  loginButtonText: {
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
