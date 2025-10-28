import { Feather } from '@expo/vector-icons'; // Importar ícones
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // Importar
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react'; // Remover useEffect, useState
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
  const { user } = useAuth(); // Acessar user para pegar o role
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtleText,
        tabBarStyle: {
          backgroundColor: colors.card, // Cor de fundo das abas
          borderTopColor: colors.border,
          height: 60, // Ajuste a altura se necessário
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Início') {
            iconName = 'home';
          } else if (route.name === 'Itens') {
            iconName = 'grid'; // Ou 'list', 'box', etc.
          } else if (route.name === 'AdminTab' && isAdmin) { // Icone para Admin
            iconName = 'tool';
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen
        name="Início"
        component={HomeScreen}
      />
      <Tab.Screen
        name="Itens"
        component={ItensScreen}
      />
      {isAdmin && (
        <Tab.Screen
          name="AdminTab" // Nome interno da rota para a aba Admin
          component={AdminScreen}
          options={{
            title: "Admin" // Título que aparece na aba
          }}
        />
      )}
    </Tab.Navigator>
  );
};


// Navegador Principal (quando logado) - AGORA USA TabsNavigator
const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsNavigator} /> {/* Aqui está o novo navegador de abas */}
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="CadastroItem" component={CadastroItemScreen} />
      <Stack.Screen name="DetalhesItem" component={DetalhesItemScreen} />
      {/* AdminScreen não precisa estar aqui diretamente, pois já está dentro de TabsNavigator */}
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

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
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
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <RootNavigator />
        <Toast />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}