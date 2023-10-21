import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC06IenV34kKBbGdRCvvLOZVnHPAgKqTBs",
  authDomain: "dive-assignment-aa9ef.firebaseapp.com",
  projectId: "dive-assignment-aa9ef",
  storageBucket: "dive-assignment-aa9ef.appspot.com",
  messagingSenderId: "605264181545",
  appId: "1:605264181545:web:e6ada3e949c3b8e9efdf38",
  databaseURL: "https://dive-assignment-aa9ef-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase(app);

const provider = new GoogleAuthProvider();
export { auth, provider, database };
