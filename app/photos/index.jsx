// app/photos/index.jsx
import { useState, useEffect } from "react";
import {View, Text, Image, Button, FlatList, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator, TextInput, Modal, RefreshControl,} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../../utils/firebaseConfig";
import {  getAllPhotosOnce, deletePhoto,  toggleLike,  getLikeCount,  hasUserLiked, addComment, getComments} from "../../utils/firestoreHelpers";
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from "date-fns";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function PhotosHome() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState({}); // { photoId: { count: number, hasLiked: boolean } }
  const [comments, setComments] = useState({}); // { photoId: comments[] }
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
  React.useCallback(() => {
    console.log("Loading photos...");
    console.log("Current user:", auth.currentUser?.email);
    console.log("Using simple manual loading to avoid ad blocker issues");

    loadPhotosManually(); // 👈 refresh posts every time screen is focused
  }, [])
);

  const loadPhotosManually = async () => {
    try {
      console.log("Loading photos...");
      const photos = await getAllPhotosOnce();
      console.log("Photos loaded:", photos.length);
      setPhotos(photos);
      setLoading(false);
      
      // Load likes and comments for each photo
      photos.forEach(photo => {
        loadLikesForPhoto(photo.id);
        loadCommentsForPhoto(photo.id);
      });
    } catch (error) {
      console.error("Failed to load photos:", error);
      Alert.alert(
        "Error", 
        `Failed to load photos: ${error.message}`,
        [
          { text: "Try Again", onPress: () => loadPhotosManually() },
          { text: "OK" }
        ]
      );
      setLoading(false);
    }
  };

  const loadLikesForPhoto = async (photoId) => {
    try {
      const [likeCount, hasLiked] = await Promise.all([
        getLikeCount(photoId),
        hasUserLiked(photoId)
      ]);
      
      setLikes(prev => ({
        ...prev,
        [photoId]: { count: likeCount, hasLiked }
      }));
    } catch (error) {
      console.error("Error loading likes:", error);
      // Set default values if loading fails
      setLikes(prev => ({
        ...prev,
        [photoId]: { count: 0, hasLiked: false }
      }));
    }
  };

  const loadCommentsForPhoto = async (photoId) => {
    try {
      const commentsList = await getComments(photoId);
      setComments(prev => ({
        ...prev,
        [photoId]: commentsList
      }));
    } catch (error) {
      console.error("Error loading comments:", error);
      // Set empty array if loading fails
      setComments(prev => ({
        ...prev,
        [photoId]: []
      }));
    }
  };

  const handleLike = async (photoId) => {
    try {
      const liked = await toggleLike(photoId);
      // Reload likes to get accurate count
      await loadLikesForPhoto(photoId);
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert("Error", "Failed to like post");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await addComment(selectedPhotoId, newComment);
      setNewComment("");
      // Reload comments for this photo
      await loadCommentsForPhoto(selectedPhotoId);
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  const openCommentsModal = (photoId) => {
    setSelectedPhotoId(photoId);
    setShowCommentsModal(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log("Manual refresh triggered");
    
    try {
      // Simply reload photos
      await loadPhotosManually();
    } catch (error) {
      console.error("Manual refresh error:", error);
      Alert.alert(
        "Refresh Failed", 
        `Failed to refresh photos: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setRefreshing(false);
    }
  };


 const handleDelete = async (photo) => {
  try {
    await deletePhoto(photo.id, photo.ownerId);
    await loadPhotosManually(); // 🔄 refresh feed immediately
  } catch (err) {
    Alert.alert("Error", err.message);
  }
};

  const renderItem = ({ item }) => {
    const isOwner = auth.currentUser?.uid === item.ownerId;

    return (
      <View style={styles.postCard}>
  {/* Header with user info */}
  <View style={styles.postHeader}>
    <View style={styles.userInfo}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={30} color="#FFF" />
      </View>
            <View style={styles.userDetails}>
              <Text style={styles.username}>{item.ownerEmail.split('@')[0]}</Text>
              <Text style={styles.timestamp}>
  {item.createdAt?.seconds
    ? formatDistanceToNow(new Date(item.createdAt.seconds * 1000), { addSuffix: true })
    : ""}
</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreIcon}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ 
              uri: item.url,
              headers: Platform.OS === 'web' ? {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
              } : undefined
            }} 
            style={styles.postImage}
            resizeMode="cover"
            onError={(error) => {
              console.log('Image load error:', error.nativeEvent.error);
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', item.url);
            }}
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLike(item.id)}
            >
              <Text style={[
                styles.actionIcon,
                likes[item.id]?.hasLiked && styles.likedIcon
              ]}>
                {likes[item.id]?.hasLiked ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => openCommentsModal(item.id)}
            >
              <Text style={styles.actionIcon}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📤</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔖</Text>
          </TouchableOpacity>
        </View>

        {/* Likes */}
        <View style={styles.likesSection}>
          <Text style={styles.likesText}>
            {likes[item.id]?.count || 0} likes
          </Text>
        </View>
        
        {/* Caption */}
        <View style={styles.captionSection}>
          <Text style={styles.captionText}>
            <Text style={styles.username}>{item.ownerEmail.split('@')[0]}</Text>
            <Text style={styles.caption}> {item.title}</Text>
          </Text>
          </View>

        {/* Comments */}
        <TouchableOpacity 
          style={styles.commentsButton}
          onPress={() => openCommentsModal(item.id)}
        >
          <Text style={styles.commentsText}>
            View all {comments[item.id]?.length || 0} comments
          </Text>
        </TouchableOpacity>

        {/* Owner actions */}
          {isOwner && (
          <View style={styles.ownerActions}>
              <TouchableOpacity
              style={styles.editButton}
                onPress={() => router.push(`/photos/edit/${item.id}`)}
              >
              <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
              style={styles.deleteButton}
                onPress={() => handleDelete(item)}
              >
              <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Profile + Search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push({ pathname: "/profile", params: { email: auth.currentUser?.email } })} style={styles.headerButton}>
          <Ionicons name="person-outline" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.logo}>Reelstagram</Text>
      </View>

      {/* Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E4405F" />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}></Text>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.timeline}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E4405F"
              colors={["#E4405F"]}
            />
          }
        />
      )}

      {/* Floating add button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/photos/create")}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCommentsModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments</Text>
            <View style={styles.placeholder} />
          </View>

          <FlatList
            data={comments[selectedPhotoId] || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Text style={styles.commentUsername}>
                  {item.userEmail.split('@')[0]}
                </Text>
                <Text style={styles.commentText}>{item.text}</Text>
              </View>
            )}
            style={styles.commentsList}
          />

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#8E8E8E"
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity 
              style={styles.postCommentButton}
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Text style={[
                styles.postCommentText,
                !newComment.trim() && styles.postCommentDisabled
              ]}>
                Post
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000000" 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },
  headerButton: {
    marginTop: 30,
    marginLeft: -10,
    padding: 20,
    borderRadius: 35,
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#E4405F",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerIcon: { 
    fontSize: 22, 
    color: "#FFFFFF" 
  },
  logo: { 
    fontSize: 30,
    fontWeight: "bold", 
    color: "#FFFFFF",
    letterSpacing: 1,
    
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E8E"
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#8E8E8E",
    textAlign: "center"
  },

  timeline: { 
    paddingBottom: 100
  },

  // Instagram-style post card
  postCard: {
     width: width * 0.9,
    alignSelf: "center",
    backgroundColor: "#000000",
    marginBottom: 4,
    margintop: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
    paddingBottom: 2,
    paddingTop: 2,
  },

  // Post header
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E4405F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  timestamp: {
    fontSize: 12,
    color: "#8E8E8E",
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  moreIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
  },

 imageContainer: {
  width: width * 0.85,          // full width
  maxHeight: 500,
  aspectRatio: 1,         // keep square ratio
  alignSelf: "center",    // center it in the post
  backgroundColor: "#000000",
  justifyContent: "center",
  alignItems: "center",
  marginTop: 2,      // add some breathing sp
  marginBottom: 2,
  height: undefined,
},
postImage: {
  width: "100%",
  height: "100%",
  resizeMode: "contain",  // makes the photo centered and scaled
},

  // Action buttons
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 24,
  },

  // Likes
  likesSection: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  likesText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Caption
  captionSection: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  captionText: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  caption: {
    fontWeight: "400",
  },

  // Comments
  commentsButton: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: "#8E8E8E",
  },

  // Owner actions
 ownerActions: {
  flexDirection: "row",
  justifyContent: "center",   // center instead of space-around
  paddingHorizontal: 16,
  paddingTop: 2,
  borderTopWidth: 1,
  borderTopColor: "#2C2C2E",
  marginTop: 2,
},
  editButton: {
  backgroundColor: "#E4405F",
  paddingHorizontal: 10,      // smaller padding
  paddingVertical: 4,
  borderRadius: 16,
  marginRight: 4,
  alignItems: "center",
              
},
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
  backgroundColor: "#FF453A",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 16,
  marginLeft: 4,
  alignItems: "center",
  minWidth: 80,
},
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  // Floating add button
  fab: {
    position: "absolute",
    bottom: 24,           // distance from bottom
    right: 24, 
    backgroundColor: "#E4405F",
    width: 60,
    height: 60,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E4405F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { 
    fontSize: 50,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textAlignVertical: "center", // Android only
    fontFamily: "monospace"   
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#FFFFFF",
    marginRight: 12,
    maxHeight: 100,
  },
  postCommentButton: {
    backgroundColor: "#E4405F",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  postCommentText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  postCommentDisabled: {
    opacity: 0.5,
  },
  likedIcon: {
    transform: [{ scale: 1.2 }],
  },
});
