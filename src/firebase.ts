import { initializeApp } from "firebase/app";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyAUoK_W5r1AAoyCZwHiq0xR3cRDpPYIWcQ",
    authDomain: "booking-4fbd3.firebaseapp.com",
    projectId: "booking-4fbd3",
    storageBucket: "booking-4fbd3.firebasestorage.app",
    messagingSenderId: "550289609886",
    appId: "1:550289609886:web:f0825e14645e206a6b978f",
    measurementId: "G-DY47W9909J"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

export { app, functions };
