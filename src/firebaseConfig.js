import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBIoQdb3pcIda7qH5ON609rQRT7xFTTaww",
    authDomain: "peak-baguio-admin.firebaseapp.com",
    projectId: "peak-baguio-admin",
    storageBucket: "peak-baguio-admin.firebasestorage.app",
    messagingSenderId: "311449244629",
    appId: "1:311449244629:web:e9e1310a000246758e235c",
    measurementId: "G-H146LKX8BB"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Export Firestore database and Authentication
export const db = getFirestore(app);
export const auth = getAuth(app); // Fix: Export auth object
export { storage, app };