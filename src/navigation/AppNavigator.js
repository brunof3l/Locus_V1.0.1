import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../firebase/config';
import { navTheme, styles } from '../theme';
import { useThemeColor } from '../constants/theme'

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import ItensScreen from '../screens/ItensScreen';
import ScannerScreen from '../screens/ScannerScreen';
import CadastroItemScreen from '../screens/CadastroItemScreen';
import DetalhesItemScreen from '../screens/DetalhesItemScreen';
import AdminScreen from '../screens/AdminScreen';
import Toast from 'react-native-toast-message';

// Fonts
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, useFonts } from '@expo-google-fonts/roboto';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

const AuthStack = createNativeStackNavigator();
const AppTabs = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const Tabs = () => {
  const { role } = useAuth();
  const colors = useThemeColor();
  return (
    <AppTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtleText,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: 'Roboto_500Medium',
          fontSize: 12,
        },
        tabBarIcon: ({ color, size }) => {
          const icon = route.name === 'Início' ? 'home' : route.name === 'Itens' ? 'grid' : 'shield';
          return <Feather name={icon} size={size} color={color} />;
        },
      })}
    >
      <AppTabs.Screen name="Início" component={HomeScreen} />
      <AppTabs.Screen name="Itens" component={ItensScreen} />
      {role === 'admin' && <AppTabs.Screen name="Admin" component={AdminScreen} />}
    </AppTabs.Navigator>
  );
};

const RootNavigator = () => {
  const colors = useThemeColor();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Cadastro" component={SignupScreen} />
      </AuthStack.Navigator>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={Tabs} />
      <RootStack.Screen name="Scanner" component={ScannerScreen} />
      <RootStack.Screen name="CadastroItem" component={CadastroItemScreen} />
      <RootStack.Screen name="DetalhesItem" component={DetalhesItemScreen} />
    </RootStack.Navigator>
  );
};

export default function AppNavigator() {
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
      <Toast />
    </AuthProvider>
  );
}