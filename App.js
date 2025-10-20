import { registerRootComponent } from 'expo';
import 'react-native-gesture-handler';

// --- INÍCIO DA INICIALIZAÇÃO DO FIREBASE ---
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_S3KjuS7S5HHNkkf3RNR8Rth2KfkPm6M",
  authDomain: "locus-64393.firebaseapp.com",
  projectId: "locus-64393",
  storageBucket: "locus-64393.appspot.com",
  messagingSenderId: "774733852369",
  appId: "1:774733852369:web:b4507af879a0f2f2695ff0",
  measurementId: "G-W03DW6DMSE"
};

// Garante que a inicialização ocorra apenas uma vez
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicializa o Auth com persistência
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Inicializa o Firestore
const db = getFirestore(app);

// Exporte as instâncias para que o resto do app possa usá-las
// (Embora não seja o ideal, vamos fazer isso para garantir que funcione)
export { auth, db };
// --- FIM DA INICIALIZAÇÃO DO FIREBASE ---

// Agora importe o resto do seu aplicativo
  import AppNavigator from './src/navigation/AppNavigator';

// Registre o AppNavigator como o componente principal
registerRootComponent(AppNavigator);