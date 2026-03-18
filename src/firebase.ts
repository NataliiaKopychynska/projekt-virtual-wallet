import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCkF1fdkNGfimpJPhxJsGiX-q9G3ysfZfk",
  authDomain: "szwedoproject.firebaseapp.com",
  projectId: "szwedoproject",
  storageBucket: "szwedoproject.appspot.com",
  messagingSenderId: "465557053748",
  appId: "1:465557053748:web:9284968417a6f658080561",
  measurementId: "G-KD983H9MPT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const registerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);
