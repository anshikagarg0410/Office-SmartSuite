import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJMQYV0CCXE-Y2U_v3PkbidXm2D1GEOm4",
  authDomain: "office-smartsuite.firebaseapp.com",
  projectId: "office-smartsuite",
  storageBucket: "office-smartsuite.firebasestorage.app",
  messagingSenderId: "567437064266",
  appId: "1:567437064266:web:085050d3657f0868164eb3",
  measurementId: "G-4KECG1R5W9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);