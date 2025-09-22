import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Platform } from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../utils/firebaseConfig"; 
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
export default function Profile() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [profileImage, setProfileImage] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [username, setUsername] = useState('');
  

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // ✅ use username from Firestore
          setUsername(data.username || "No username set");
          setUserEmail(auth.currentUser?.email || "No email available");

          // ✅ profile image from Firestore
          setProfileImage(data.profileImage || null);
        } else {
          setUsername("No username set");
          setUserEmail(auth.currentUser?.email || "No email available");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [email]);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (pickerResult.canceled) return;

      const localUri = pickerResult.assets[0].uri;

      // ✅ Upload to Cloudinary
      const formData = new FormData();
      if (Platform.OS === "web") {
        const fetchRes = await fetch(localUri);
        const fileBlob = await fetchRes.blob();
        formData.append("file", fileBlob, "profile.jpg");
      } else {
        formData.append("file", {
          uri: localUri,
          type: "image/jpeg",
          name: `profile_${Date.now()}.jpg`,
        });
      }

      formData.append("upload_preset", "profiles"); // your Cloudinary preset

      const cloudResponse = await fetch(
        "https://api.cloudinary.com/v1_1/dbujvk8tt/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudJson = await cloudResponse.json();
      if (!cloudResponse.ok) throw new Error(cloudJson.error?.message || "Cloudinary upload failed");

      const secureUrl = cloudJson.secure_url;

      // ✅ Save to Firestore
      const userId = auth.currentUser?.uid;
      if (userId) {
        await updateDoc(doc(db, "users", userId), {
          profileImage: secureUrl,
        });
      }

      setProfileImage(secureUrl);
      Alert.alert("Success", "Profile picture updated!");
    } catch (err) {
      console.error("Error picking image:", err);
      Alert.alert("Error", err.message || "Failed to update profile picture");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center" }}>
      {/* Header */}
      <View style={{ paddingVertical: 20, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#FFF" }}>Profile</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        
        {/* Profile Image */}
        <TouchableOpacity style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: "#E4405F", justifyContent: "center", alignItems: "center", marginBottom: 20 }} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={{ width: 90, height: 90, borderRadius: 45 }} />
          ) : (
            <Ionicons name="person-outline" size={45} color="#FFF" />
          )}
          <View style={{ position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: "#E4405F" }}>+</Text>
          </View>
        </TouchableOpacity>

        {/* Username */}
        <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#FFF" }}>
          {username}
        </Text>

        {/* Email */}
        <Text style={{ fontSize: 20, color: "#FFF", marginBottom: 5 }}>Email:</Text>
        <Text style={{ fontSize: 18, color: "#FFF", marginBottom: 35 }}>{userEmail}</Text>

        {/* Buttons */}
        <TouchableOpacity style={{ width: "70%", backgroundColor: "#E4405F", paddingVertical: 14, borderRadius: 25, alignItems: "center", marginBottom: 15 }} onPress={() => router.replace("/")}>
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "bold" }}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ width: "70%", backgroundColor: "#dc3545", paddingVertical: 14, borderRadius: 25, alignItems: "center" }} onPress={handleLogout}>
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "bold" }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center", // center everything horizontally
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#2C2C2E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 10,
  },
  backIcon: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  placeholder: {
    display: "none", // hides search
  },
  card: {
    width: width * 0.85, // narrower card 
    marginTop: 20,
    backgroundColor: "#1C1C1E",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2C2C2E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    alignItems: "center",
  },
  profileIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E4405F",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#E4405F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  profileEmoji: {
    fontSize: 45,
    color: "#FFF",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#E4405F",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraEmoji: {
    fontSize: 14,
    color: "#E4405F",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#FFFFFF",
  },
  label: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 15,
    color: "#FFFFFF",
    textAlign: "center",
  },
  value: {
    fontSize: 18,
    marginBottom: 35,
    color: "#ffffff",
    textAlign: "center",
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    fontWeight: "600",
  },
  buttonContainer: {
    width: width * 0.9,
    gap: 18,
    marginTop: 10,
    alignItems: "center", // center the buttons
  },
  primaryButton: {
    width: "70%", // reduced button width
    backgroundColor: "#E4405F",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#E4405F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    width: width * 0.7, // reduced button width
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2C2C2E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  dangerButton: {
    width: "70%", // reduced button width
    backgroundColor: "#dc3545",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
