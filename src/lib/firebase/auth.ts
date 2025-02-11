import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const clientConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Check if any Firebase apps have been initialized
const app = getApps().length === 0 ? initializeApp(clientConfig) : getApps()[0];

export const auth = getAuth(app);
