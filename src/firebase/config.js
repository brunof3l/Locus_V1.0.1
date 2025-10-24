import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD_S3KjuS7S5HHNkkf3RNR8Rth2KfkPm6M",
  authDomain: "locus-64393.firebaseapp.com",
  projectId: "locus-64393",
  storageBucket: "locus-64393.appspot.com",
  messagingSenderId: "774733852369",
  appId: "1:774733852369:web:b4507af879a0f2f2695ff0",
  measurementId: "G-W03DW6DMSE"
};

// Garante inicialização única do app Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicializa serviços
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

// Exporta serviços
export { app, auth, db, storage };

