import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  "projectId": "studio-7196860188-87957",
  "appId": "1:853903303824:web:eb6981a72ba2cdbcc5e415",
  "storageBucket": "studio-7196860188-87957.firebasestorage.app",
  "apiKey": "AIzaSyCPmRSKOCPQf0pEaNoPuC33WbG0NyX6oa0",
  "authDomain": "studio-7196860188-87957.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "853903303824",
  "databaseURL": "https://studio-7196860188-87957-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

export { app, database };
