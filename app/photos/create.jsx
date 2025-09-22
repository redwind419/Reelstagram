import React, { useState } from "react";
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  Text, 
  ScrollView,
  ActivityIndicator 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { savePhoto } from "../../utils/firestoreHelpers";
import { auth } from "../../utils/firebaseConfig";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { serverTimestamp } from "firebase/firestore";

export default function CreatePhoto() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pickImage = async () => {
    try {
      setError("");
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "We need access to your photos to upload.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title for your photo");
      return;
    }
    if (!image) {
      setError("Please select an image to upload");
      return;
    }

    try {
      setUploading(true);
      setError("");

      console.log("Starting upload process...");

      // Check if user is authenticated
      if (!auth.currentUser) {
        throw new Error("User not authenticated. Please log in again.");
      }

      // Use the helper to upload to Cloudinary (make sure your helper has your preset & cloud name)
      const downloadUrl = await uploadToCloudinary(image);
console.log("downloadUrl:", downloadUrl);
if (!downloadUrl) {
  throw new Error("Upload failed: no URL returned from Cloudinary");
}

      // Save metadata to Firestore
      console.log("Saving to Firestore...");
      const photoData = {
        title: title.trim(),
        url: downloadUrl,
        ownerId: auth.currentUser.uid,
        ownerEmail: auth.currentUser.email,
         createdAt: serverTimestamp(),
      };
      console.log("Photo data:", photoData);

      const photoId = await savePhoto(photoData);
      console.log("Photo saved with ID:", photoId);

      console.log("Upload successful!");
      Alert.alert("Success! 🎉", "Your photo has been uploaded successfully!");
      router.replace("/photos");
    } catch (err) {
      console.error("Upload error:", err);
      setError(`Upload failed: ${err.message}`);
      Alert.alert("Upload Error", `Failed to upload photo: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Post</Text>
        <Text style={styles.subtitle}>Upload a photo</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Post Title</Text>
          <TextInput
            placeholder="Give your photo a creative title..."
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            maxLength={50}
          />
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.label}>Select Image</Text>
          {image ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={pickImage}
              >
                <Text style={styles.changeImageText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Text style={styles.pickerIcon}>+</Text>
              <Text style={styles.pickerText}>Choose from Gallery</Text>
              <Text style={styles.pickerSubtext}>Tap to select an image</Text>
            </TouchableOpacity>
          )}
        </View>
        

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!title.trim() || !image || uploading) && styles.uploadButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!title.trim() || !image || uploading}
        >
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : (
            <View style={styles.uploadContainer}>
              <Text style={styles.uploadIcon}></Text>
              <Text style={styles.uploadText}>Upload Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000000" 
  },
  header: {
    backgroundColor: "transparent",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E8E",
    textAlign: "center"
  },
  form: {
  padding: 20,
  width: "90%",       // 👈 same as profile cards
  alignSelf: "center", // 👈 centers horizontally
  maxWidth: 400        // 👈 optional: stops it from being huge on tablets
},
input: {
  borderWidth: 1,
  borderColor: "#2C2C2E",
  padding: 16,
  borderRadius: 12,
  fontSize: 16,
  backgroundColor: "#1C1C1E",
  color: "#FFFFFF",
  width: "100%"        // 👈 so input respects form width
},
uploadButton: {
  backgroundColor: "#E4405F",
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  alignItems: "center",
  shadowColor: "#E4405F",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
  width: "100%"        // 👈 keeps it inside form width
},
  inputGroup: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#2C2C2E",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: "#1C1C1E",
    color: "#FFFFFF"
  },
  imageSection: {
    marginBottom: 24
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: "#2C2C2E",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    backgroundColor: "#1C1C1E"
  },
  pickerIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  pickerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4
  },
  pickerSubtext: {
    fontSize: 14,
    color: "#8E8E8E"
  },
  imagePreview: {
    position: "relative"
  },
  previewImage: {
    width: "90%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#000000",
    alignSelf: "center",
    resizeMode: "contain"
  },
  changeImageButton: {
    position: "absolute",
    top: 12,
    right: "7%",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  changeImageText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FF453A"
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8
  },
  errorText: {
    color: "#FF453A",
    fontSize: 14,
    flex: 1
  },
  uploadButton: {
    backgroundColor: "#E4405F",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#E4405F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  uploadButtonDisabled: {
    backgroundColor: "#8E8E8E",
    shadowOpacity: 0
  },
  uploadContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  uploadIcon: {
    fontSize: 20,
    marginRight: 8
  },
  uploadText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold"
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  uploadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8
  },
  backButton: {
  position: "absolute",
  left: 20,
  top: 24,
  padding: 8,
},
backText: {
  fontSize: 50,   // ✅ better size for consistency
  color: "#FFFFFF",
  fontWeight: "bold"
},

});
