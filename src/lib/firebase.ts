import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

// Firebase Web SDK configuration. Sourced from env so secrets/project ids are
// not committed — see .env.example for the required VITE_FIREBASE_* keys. This
// is the same Firebase project the backend's Admin SDK / REST endpoints use.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

// Google: default scopes (email, profile) are enough for our backend exchange.
export const googleProvider = new GoogleAuthProvider();

// Apple ("Sign in with Apple"). Request name/email so the first sign-in can
// populate the Firebase user record.
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
