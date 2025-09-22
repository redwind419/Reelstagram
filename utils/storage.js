import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "user";

export async function saveUser(user) {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Error saving user", e);
  }
}

export async function getUser() {
  try {
    const json = await AsyncStorage.getItem(USER_KEY);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    console.error("Error getting user", e);
    return null;
  }
}

export async function removeUser() {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error("Error removing user", e);
  }
}
