import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || 'AIzaSyCkF1fdkNGfimpJPhxJsGiX-q9G3ysfZfk',
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || 'szwedoproject.firebaseapp.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || 'szwedoproject',
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || 'szwedoproject.appspot.com',
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '465557053748',
  appId:
    (import.meta.env.VITE_FIREBASE_APP_ID as string) ||
    '1:465557053748:web:9284968417a6f658080561',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const provider = new GoogleAuthProvider()

export interface UpsertProfilePayload {
  uid: string
  email: string
  name: string
  picture: string
  provider: 'google' | 'password'
}

export const upsertUserProfile = async ({
  uid,
  email,
  name,
  picture,
  provider: authProvider,
}: UpsertProfilePayload) => {
  await setDoc(
    doc(db, 'users', uid),
    {
      uid,
      email,
      name,
      picture,
      provider: authProvider,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )
}
