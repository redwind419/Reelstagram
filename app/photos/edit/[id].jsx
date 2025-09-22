import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { updatePhoto, getPhotoById } from '../../../utils/firestoreHelpers';
import { useFocusEffect } from "@react-navigation/native";

export default function EditPhoto() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useFocusEffect(
  React.useCallback(() => {
    loadPhoto(); // ✅ this exists in your EditPhoto
  }, [id])
);


  const loadPhoto = async () => {
    try {
      setLoading(true);
      const photo = await getPhotoById(id);
      if (!photo) {
        Alert.alert('Error', 'Photo not found');
        router.back();
        return;
      }
      setTitle(photo.title || '');
    } catch (error) {
      console.error('Error loading photo:', error);
      Alert.alert('Error', 'Failed to load photo');
      router.back();
    } finally {
      setLoading(false);
    }
  };

 const handleUpdate = async () => {
  if (!title.trim()) {
    Alert.alert('Error', 'Please enter a title');
    return;
  }

  try {
    setUpdating(true);
    await updatePhoto(id, { title: title.trim() }); // ✅ update caption

    // 👇 Show a quick alert, then navigate immediately
    Alert.alert('Success', 'Photo updated successfully');
    router.replace('/photos'); // 👈 force go to timeline
  } catch (error) {
    console.error('Error updating photo:', error);
    Alert.alert('Error', 'Failed to update photo');
  } finally {
    setUpdating(false);
  }
};


  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading photo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Photo</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caption *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="Enter photo caption"
            placeholderTextColor="#888"
            maxLength={100}
          />
        </View>

        <TouchableOpacity
          style={[styles.updateButton, updating && styles.updateButtonDisabled]}
          onPress={handleUpdate}
          disabled={updating}
        >
          <Text style={styles.updateButtonText}>
            {updating ? 'Updating...' : 'Update Caption'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' // Dark mode background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: '#2C2C2C',
  },
  backIcon: {
    fontSize: 22,
    color: '#E4405F' // Instagram pink-red
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 36
  },
  content: {
    flex: 1,
    padding: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#bbb',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#1E1E1E',
    color: '#fff'
  },
  updateButton: {
    backgroundColor: '#E4405F', // ✅ Changed button color
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonDisabled: {
    backgroundColor: '#6c757d'
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 40
  }
});
