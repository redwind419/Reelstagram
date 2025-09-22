import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { addBookmark, getMyBookmarks, removeBookmark } from "../utils/firestoreHelpers";
import { UNSPLASH_ACCESS_KEY } from "../utils/unsplashConfig";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState("results"); // "results" | "saved"
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [zoomItem, setZoomItem] = useState(null); // { id, url }
  const [editTitle, setEditTitle] = useState("");

  const searchPhotos = async () => {
    if (!query) return;
    setLoading(true);
    setError("");
    try {
      const encoded = encodeURIComponent(query.trim());
      const url = `https://api.unsplash.com/search/photos?query=${encoded}&per_page=30&content_filter=high`;
      
      const response = await fetch(url, {
        headers: {
          "Accept-Version": "v1",
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Unsplash error: ${response.status}`);
      }
      
      const data = await response.json();
      const parsed = Array.isArray(data.results) ? data.results : [];
      
      if (parsed.length === 0) {
        // Fallback: show popular photos if no search results
        const fallbackRes = await fetch(
          `https://api.unsplash.com/photos?per_page=30&order_by=popular`,
          { headers: { "Accept-Version": "v1", Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setResults(Array.isArray(fallbackData) ? fallbackData.map((p) => ({ id: p.id, urls: p.urls, user: p.user })) : []);
        } else {
          setResults([]);
        }
      } else {
        setResults(parsed);
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(`Search failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (url) => {
    await addBookmark(url, "unsplash");
    loadBookmarks();
  };

  const handleDelete = async (id) => {
    await removeBookmark(id);
    loadBookmarks();
  };

  const loadBookmarks = async () => {
    const items = await getMyBookmarks();
    setBookmarks(items);
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  // Split results into 2 columns (Pinterest style)
  const column1 = results.filter((_, i) => i % 2 === 0);
  const column2 = results.filter((_, i) => i % 2 !== 0);

  const ZoomableImage = ({ item }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true }).start();
    };
    const onPressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
      <View style={styles.imageWrapper}>
        <Animated.View style={[styles.imageContainer, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={() => setZoomItem({ id: item.id, url: item.urls.small })}
          >
            <Image source={{ uri: item.urls.small }} style={styles.image} resizeMode="cover" />
          </TouchableOpacity>

          {/* Overlay download button */}
          <TouchableOpacity
            style={styles.overlayButton}
            onPress={() => handleSave(item.urls.small)}
          >
            <Text style={styles.downloadIcon}>⬇️</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.caption}>{item.user.name}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.placeholder} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter keyword (e.g. nature)"
        value={query}
        onChangeText={setQuery}
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
        onSubmitEditing={searchPhotos}
        onKeyPress={(e) => {
          if (e?.nativeEvent?.key === "Enter") {
            searchPhotos();
          }
        }}
      />

      <TouchableOpacity 
        style={[styles.searchButton, { opacity: isInputFocused ? 1 : 0.7 }]} 
        onPress={searchPhotos}
        disabled={!query.trim()}
      >
        <Text style={styles.searchText}>Search</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "results" && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab("results");
            if (query) searchPhotos();
          }}
        >
          <Text style={[styles.tabText, activeTab === "results" && styles.tabTextActive]}>Results</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "saved" && styles.tabBtnActive]}
          onPress={() => setActiveTab("saved")}
        >
          <Text style={[styles.tabText, activeTab === "saved" && styles.tabTextActive]}>Saved</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "results" && (
        loading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : results.length === 0 && query ? (
          <Text style={styles.emptyText}>No results found</Text>
        ) : (
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {column1.map((item) => (
                <ZoomableImage key={item.id} item={item} />
              ))}
            </View>
            <View style={styles.column}>
              {column2.map((item) => (
                <ZoomableImage key={item.id} item={item} />
              ))}
            </View>
          </View>
        )
      )}

      {activeTab === "saved" && (
        <View style={styles.savedContainer}>
          <View style={styles.savedHeader}>
            <Text style={styles.savedTitle}>✨ Your Collection</Text>
            <Text style={styles.savedSubtitle}>{bookmarks.length} saved images</Text>
          </View>
          
          {bookmarks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📸</Text>
              <Text style={styles.emptyText}>No saved images yet</Text>
              <Text style={styles.emptySubtext}>Search and save images to build your collection</Text>
            </View>
          ) : (
            <View style={styles.savedGrid}>
              {bookmarks.map((item) => (
                <View key={item.id} style={styles.savedCard}>
                  <TouchableOpacity 
                    style={styles.savedImageContainer}
                    onPress={() => setZoomItem(item)}
                  >
                    <Image 
                      source={{ uri: item.url }} 
                      style={styles.savedImage}
                      resizeMode="cover"
                    />
                    <View style={styles.savedOverlay}>
                      <Text style={styles.viewIcon}>👁️</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.savedActions}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item.id)}
                    >
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Zoom/Edit Modal */}
      {zoomItem && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Image source={{ uri: zoomItem.url }} style={styles.modalImage} resizeMode="contain" />
            <TextInput
              style={styles.input}
              placeholder="Edit title (optional)"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity style={styles.deleteButton} onPress={() => setZoomItem(null)}>
                <Text style={styles.deleteText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  backIcon: {
    fontSize: 22,
    color: "#FFFFFF"
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  placeholder: {
    width: 36
  },
  input: {
    borderWidth: 1,
    borderColor: "#2C2C2E",
    padding: 16,
    borderRadius: 25,
    margin: 20,
    marginBottom: 15,
    backgroundColor: "#1C1C1E",
    fontSize: 16,
    color: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    textAlign: "center",
  },
  searchButton: {
    backgroundColor: "#E4405F",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 25,
    shadowColor: "#E4405F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchText: { 
    color: "#FFFFFF", 
    fontWeight: "bold", 
    fontSize: 16,
  },
  loading: { marginTop: 20, textAlign: "center", fontSize: 16, color: "#8E8E8E" },

  tabsRow: { 
    flexDirection: "row", 
    marginHorizontal: 20, 
    marginBottom: 20, 
    gap: 8 
  },
  tabBtn: { 
    flex: 1,
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 25, 
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#2C2C2E",
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnActive: { 
    backgroundColor: "#E4405F",
    borderColor: "#E4405F",
    shadowColor: "#E4405F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: { 
    color: "#8E8E8E", 
    fontWeight: "600",
    fontSize: 14,
  },
  tabTextActive: { 
    color: "#FFFFFF", 
    fontWeight: "bold",
    fontSize: 14,
  },

  masonryContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    paddingHorizontal: 20
  },
  column: { flex: 1, marginHorizontal: 4 },

  imageWrapper: { marginBottom: 12, alignItems: "center" },
  imageContainer: {
    position: "relative",
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200, // ✅ fixed size so consistent ang layout
    borderRadius: 10,
  },
  caption: { marginTop: 4, fontSize: 12, textAlign: "center", color: "#8E8E8E" },

  overlayButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 20,
    padding: 6,
  },
  downloadIcon: { fontSize: 16 },

  // Saved Collection Styles
  savedContainer: { 
    marginTop: 20,
    paddingHorizontal: 20
  },
  savedHeader: { 
    marginBottom: 20, 
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2C2C2E"
  },
  savedTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#FFFFFF",
    marginBottom: 4
  },
  savedSubtitle: { 
    fontSize: 14, 
    color: "#8E8E8E",
    fontStyle: "italic"
  },
  
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#8E8E8E",
    marginBottom: 8
  },
  emptySubtext: { 
    fontSize: 14, 
    color: "#8E8E8E",
    textAlign: "center",
    lineHeight: 20
  },
  
  savedGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between",
    gap: 12
  },
  savedCard: {
    width: "48%",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2C2C2E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    marginBottom: 12
  },
  savedImageContainer: {
    position: "relative",
    aspectRatio: 1,
    overflow: "hidden"
  },
  savedImage: {
    width: "100%",
    height: "100%"
  },
  savedOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 8
  },
  viewIcon: { fontSize: 16, color: "#fff" },
  
  savedActions: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "center"
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    borderRadius: 20,
    padding: 8,
    minWidth: 40,
    alignItems: "center"
  },
  deleteIcon: { fontSize: 16 },

  modalBackdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "90%",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },
  modalImage: { width: "100%", height: 300, borderRadius: 8, marginBottom: 10 },
});
