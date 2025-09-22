// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Your web app's Firebase configuration (YOUR project, not your friend's)
const firebaseConfig = {
  apiKey: "AIzaSyD8G_SReqytfv5fKZ6xHtGoGzpVmjYKOlA",
  authDomain: "reelstagram-eee74.firebaseapp.com",
  projectId: "reelstagram-eee74",
  storageBucket: "reelstagram-eee74.appspot.com", // 👈 fixed (.app → .appspot.com)
  messagingSenderId: "903791015356",
  appId: "1:903791015356:web:3606740ff1d8c328d967b9",
  measurementId: "G-36YQFMX4QL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("🔥 Firebase initialized with config:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket
});
export { app };

// Setup Firebase Auth
let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  // For React Native, setup persistence
  const { initializeAuth, getReactNativePersistence } = require("firebase/auth");
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // Fallback if already initialized
    auth = getAuth(app);
  }
}

export { auth };

// Setup Firestore & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
