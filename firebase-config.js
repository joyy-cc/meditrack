import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQNxNukLfEwmWS32kyXWX7Q7fO9yJOD3Q",
  authDomain: "meditrack-8a1d7.firebaseapp.com",
  projectId: "meditrack-8a1d7",
  storageBucket: "meditrack-8a1d7.firebasestorage.app",
  messagingSenderId: "595300198271",
  appId: "1:595300198271:web:9e179853730d4c5e475c4a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, deleteDoc, doc };

