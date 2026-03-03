import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXcfJIstS2UgnfXCQfotTrhrpcNNgLZQU",
  authDomain: "arquitecto-financiero.firebaseapp.com",
  projectId: "arquitecto-financiero",
  storageBucket: "arquitecto-financiero.firebasestorage.app",
  messagingSenderId: "528884548778",
  appId: "1:528884548778:web:ca6e3b2091f263c6ddfcd3",
  measurementId: "G-07S3M6XSXB"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };