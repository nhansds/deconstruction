import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export type FirebaseEnv = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

function readEnv(): FirebaseEnv | null {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID,
  } = import.meta.env

  if (
    !VITE_FIREBASE_API_KEY ||
    !VITE_FIREBASE_AUTH_DOMAIN ||
    !VITE_FIREBASE_PROJECT_ID ||
    !VITE_FIREBASE_APP_ID
  ) {
    return null
  }

  return {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectId: VITE_FIREBASE_PROJECT_ID,
    storageBucket: VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: VITE_FIREBASE_APP_ID,
  }
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

export function isFirebaseConfigured(): boolean {
  return readEnv() !== null
}

export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } | null {
  const cfg = readEnv()
  if (!cfg) return null

  if (!app) {
    app = initializeApp(cfg)
    auth = getAuth(app)
    db = getFirestore(app)
  }

  return { app, auth: auth!, db: db! }
}
