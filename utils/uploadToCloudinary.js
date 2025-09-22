// utils/uploadToCloudinary.js
import { Platform } from "react-native";

export const uploadToCloudinary = async (imageUri) => {
  try {
    const data = new FormData();

    if (Platform.OS === "web") {
      // On web: fetch the image and append the blob
      const r = await fetch(imageUri);
      if (!r.ok) throw new Error(`Failed to fetch image for upload: ${r.status}`);
      const blob = await r.blob();
      data.append("file", blob, "upload.jpg");
    } else {
      // On native: pass the local uri object
      data.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: `upload_${Date.now()}.jpg`,
      });
    }

    // ✅ Use your preset and cloud name
    data.append("upload_preset", "Reelstagram"); 
    const CLOUD_NAME = "dbujvk8tt";

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error?.message || `Cloudinary upload failed (${res.status})`);
    }

    if (!json.secure_url) {
      throw new Error("Cloudinary did not return secure_url");
    }

    return json.secure_url;
  } catch (err) {
    console.error("uploadToCloudinary error:", err);
    throw err;
  }
};
