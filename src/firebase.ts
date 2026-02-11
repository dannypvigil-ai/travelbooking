import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAUoK_W5r1AAoyCZwHiq0xR3cRDpPYIWcQ",
    authDomain: "booking-4fbd3.firebaseapp.com",
    projectId: "booking-4fbd3",
    storageBucket: "booking-4fbd3.firebasestorage.app",
    messagingSenderId: "550289609886",
    appId: "1:550289609886:web:e94138729c9b25556b978f",
    measurementId: "G-3FNP9KD10T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
