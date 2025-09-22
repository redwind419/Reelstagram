// utils/firestoreHelpers.js
import { db, auth } from "./firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  deleteDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const PHOTOS_COL = "photos";
const BOOKMARKS_COL = "bookmarks";
const LIKES_COL = "likes";
const COMMENTS_COL = "comments";

/**
 * Save a photo (new or update).
 * Photo fields: { id?, title, url }
 * Will auto-add ownerId & ownerEmail from current user.
 */
export async function savePhoto(photo) {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const baseData = {
    title: photo.title,
    url: photo.url,
    ownerId: user.uid,
    ownerEmail: user.email,
    createdAt: serverTimestamp(),
  };

  if (photo.id) {
    // update existing doc
    const ref = doc(db, PHOTOS_COL, photo.id);
    await setDoc(ref, baseData, { merge: true });
    return photo.id;
  } else {
    // create new doc
    const colRef = collection(db, PHOTOS_COL);
    const docRef = await addDoc(colRef, baseData);
    return docRef.id;
  }
}

// ===== Bookmarks (Saved from Search) =====
export async function addBookmark(url, source = "unsplash") {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const colRef = collection(db, BOOKMARKS_COL);
  const docRef = await addDoc(colRef, {
    uid: user.uid,
    url,
    source,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getMyBookmarks() {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(collection(db, BOOKMARKS_COL), where("uid", "==", user.uid));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return items;
}

export async function removeBookmark(id) {
  const ref = doc(db, BOOKMARKS_COL, id);
  await deleteDoc(ref);
}

/**
 * One-time get all photos (latest first).
 */
export async function getAllPhotosOnce() {
  const q = query(collection(db, PHOTOS_COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time subscription for photos feed.
 */
export function subscribeAllPhotos(onUpdate, onError) {
  const q = query(collection(db, PHOTOS_COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, 
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate(items);
    },
    (error) => {
      console.error("Photos subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Get photos uploaded by a specific user.
 */
export async function getUserPhotos(uid) {
  // Allow callers to omit uid; fall back to current user
  const effectiveUid = uid || auth.currentUser?.uid;
  if (!effectiveUid) {
    // No user context; return empty list instead of throwing where(undefined)
    return [];
  }

  // Avoid composite index requirement by removing server-side orderBy
  const q = query(collection(db, PHOTOS_COL), where("ownerId", "==", effectiveUid));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Client-side sort by createdAt desc (createdAt may be a Firestore Timestamp)
  items.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });
  return items;
}

/**
 * Update photo metadata.
 */
export async function updatePhoto(id, updates) {
  const ref = doc(db, PHOTOS_COL, id);
  await updateDoc(ref, updates);
}

/**
 * Get a single photo by ID.
 */
export async function getPhotoById(id) {
  const ref = doc(db, PHOTOS_COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Delete photo (with ownership check).
 */
export async function deletePhoto(id, ownerId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  if (user.uid !== ownerId) throw new Error("You can only delete your own photos");

  const ref = doc(db, PHOTOS_COL, id);
  await deleteDoc(ref);
}

// ===== Likes System =====
/**
 * Like or unlike a photo
 */
export async function toggleLike(photoId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const likeId = `${user.uid}_${photoId}`;
  const likeRef = doc(db, LIKES_COL, likeId);
  
  try {
    // Try to get existing like
    const likeSnap = await getDoc(likeRef);
    
    if (likeSnap.exists()) {
      // Unlike: delete the like document
      await deleteDoc(likeRef);
      return false; // unliked
    } else {
      // Like: create new like document
      await setDoc(likeRef, {
        userId: user.uid,
        userEmail: user.email,
        photoId: photoId,
        createdAt: serverTimestamp(),
      });
      return true; // liked
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
}

/**
 * Get like count for a photo
 */
export async function getLikeCount(photoId) {
  const q = query(collection(db, LIKES_COL), where("photoId", "==", photoId));
  const snap = await getDocs(q);
  return snap.size;
}

/**
 * Check if current user has liked a photo
 */
export async function hasUserLiked(photoId) {
  const user = auth.currentUser;
  if (!user) return false;

  const likeId = `${user.uid}_${photoId}`;
  const likeRef = doc(db, LIKES_COL, likeId);
  const likeSnap = await getDoc(likeRef);
  return likeSnap.exists();
}

/**
 * Real-time subscription for likes on a photo
 */
export function subscribeToLikes(photoId, onUpdate) {
  const q = query(collection(db, LIKES_COL), where("photoId", "==", photoId));
  return onSnapshot(q, (snapshot) => {
    const likes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    onUpdate(likes);
  });
}

// ===== Comments System =====
/**
 * Add a comment to a photo
 */
export async function addComment(photoId, text) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const colRef = collection(db, COMMENTS_COL);
  const docRef = await addDoc(colRef, {
  photoId: photoId,
  userId: user.uid,
  userEmail: user.email,
  userProfileImage: user.photoURL || null, // ✅ save profile picture
  text: text.trim(),
  createdAt: serverTimestamp(),
});
return docRef.id;
}

/**
 * Get comments for a photo
 */
export async function getComments(photoId) {
  const q = query(
    collection(db, COMMENTS_COL), 
    where("photoId", "==", photoId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time subscription for comments on a photo
 */
export function subscribeToComments(photoId, onUpdate) {
  const q = query(
    collection(db, COMMENTS_COL), 
    where("photoId", "==", photoId),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    onUpdate(comments);
  });
}

/**
 * Delete a comment (only by the comment author)
 */
export async function deleteComment(commentId, userId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  if (user.uid !== userId) throw new Error("You can only delete your own comments");

  const ref = doc(db, COMMENTS_COL, commentId);
  await deleteDoc(ref);
}
