import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Save all user data to Firestore
export async function saveUserData(userId: string, data: {
  presupuesto: Record<string, any>;
  gastos: any[];
  recurring: Record<string, any>;
  obData: Record<string, any>;
  onboarded: boolean;
}) {
  try {
    await setDoc(doc(db, "users", userId), {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving data:", error);
    return false;
  }
}

// Load all user data from Firestore
export async function loadUserData(userId: string) {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error("Error loading data:", error);
    return null;
  }
}

// Save just the presupuesto
export async function savePresupuesto(userId: string, presupuesto: Record<string, any>) {
  try {
    await setDoc(doc(db, "users", userId), { presupuesto, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving presupuesto:", error);
    return false;
  }
}

// Save just the gastos
export async function saveGastos(userId: string, gastos: any[]) {
  try {
    await setDoc(doc(db, "users", userId), { gastos, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving gastos:", error);
    return false;
  }
}

// Save recurring config
export async function saveRecurring(userId: string, recurring: Record<string, any>) {
  try {
    await setDoc(doc(db, "users", userId), { recurring, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving recurring:", error);
    return false;
  }
}