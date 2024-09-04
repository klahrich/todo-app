import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAQipcMOl525_RmpzcysmbV6KOEAPnnAKA",
    authDomain: "test-project-8bb8f.firebaseapp.com",
    projectId: "test-project-8bb8f",
    storageBucket: "test-project-8bb8f.appspot.com",
    messagingSenderId: "60068116436",
    appId: "1:60068116436:web:652d724e7f48dfb6e40841"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);