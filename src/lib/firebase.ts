import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "studio-2611686892-9170f",
  "appId": "1:147299077628:web:fd53c13d0721212d78b679",
  "apiKey": "AIzaSyB5VPdCmYRHhEYKbO1yiOAcBw7aKoayb-o",
  "authDomain": "studio-2611686892-9170f.firebaseapp.com",
  "messagingSenderId": "147299077628"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
