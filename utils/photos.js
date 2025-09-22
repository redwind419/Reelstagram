import AsyncStorage from '@react-native-async-storage/async-storage';
const PHOTO_KEY = 'ARTSPARK_PHOTOS_v1';

export async function getPhotos() {
  const raw = await AsyncStorage.getItem(PHOTO_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function savePhoto(photo) {
  const list = await getPhotos();
  list.unshift(photo);
  await AsyncStorage.setItem(PHOTO_KEY, JSON.stringify(list));
}

export async function updatePhoto(id, updates) {
  const list = await getPhotos();
  const next = list.map(p => (p.id === id ? { ...p, ...updates } : p));
  await AsyncStorage.setItem(PHOTO_KEY, JSON.stringify(next));
}

export async function deletePhoto(id) {
  const list = await getPhotos();
  const next = list.filter(p => p.id !== id);
  await AsyncStorage.setItem(PHOTO_KEY, JSON.stringify(next));
}
