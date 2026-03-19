import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function saveUserData(userId: string, data: any) {
  try {
    await setDoc(doc(db, "users", userId), {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving:", error);
    return false;
  }
}

export async function loadUserData(userId: string) {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) return snap.data();
    return null;
  } catch (error) {
    console.error("Error loading:", error);
    return null;
  }
}

export async function saveField(userId: string, field: string, value: any) {
  try {
    await setDoc(doc(db, "users", userId), { [field]: value, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving field:", error);
    return false;
  }
}
