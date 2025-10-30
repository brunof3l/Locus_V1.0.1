import { Feather } from '@expo/vector-icons'; // Importar ícones
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // Importar
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react'; // Usar useEffect para controlar o Splash
import { ActivityIndicator, Text, View } from 'react-native'; // Adicionar Text
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useThemeColor } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AdminScreen from '../screens/AdminScreen';
import CadastroItemScreen from '../screens/CadastroItemScreen';
import DetalhesItemScreen from '../screens/DetalhesItemScreen';
import HomeScreen from '../screens/HomeScreen';
import ItensScreen from '../screens/ItensScreen';
import LoginScreen from '../screens/LoginScreen';
import ScannerScreen from '../screens/ScannerScreen';
import SignupScreen from '../screens/SignupScreen';
import { styles } from '../theme';

const Stack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator(); // Instanciar BottomTabNavigator

SplashScreen.preventAutoHideAsync();

// #### NOVO: Componente para as abas inferiores ####
const TabsNavigator = () => {
  const colors = useThemeColor();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtleText,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            'Início': 'home',
            'Itens': 'grid',
            'AdminTab': 'tool',
          };
          const name = iconMap[route.name] || 'circle';
          return <Feather name={name} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Itens" component={ItensScreen} />
      {isAdmin && (
        <Tab.Screen
          name="AdminTab"
          component={AdminScreen}
          options={{ title: 'Admin' }}
        />
      )}
    </Tab.Navigator>
  );
};


// Navegador Principal (quando logado) - AGORA USA TabsNavigator
const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="CadastroItem" component={CadastroItemScreen} />
      <Stack.Screen name="DetalhesItem" component={DetalhesItemScreen} />
    </Stack.Navigator>
  );
};

// Navegador de Autenticação (quando deslogado)
const AuthStack = () => (
  <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNav.Screen name="Login" component={LoginScreen} />
    <AuthStackNav.Screen name="Signup" component={SignupScreen} />
  </AuthStackNav.Navigator>
);

// Componente que decide qual Stack mostrar
const RootNavigator = () => {
  const colors = useThemeColor();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

// Componente principal que carrega fontes e inicializa tudo
export default function AppNavigator() {
  const colors = useThemeColor();
  let [fontsLoaded, fontError] = useFonts({
    'Roboto_400Regular': require('../../assets/fonts/Roboto-Regular.ttf'),
    'Roboto_700Bold': require('../../assets/fonts/Roboto-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{color: colors.subtleText, marginTop: 10}}>Carregando fontes...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootNavigator />
        <Toast />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}