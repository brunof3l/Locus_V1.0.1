import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Card from '../components/Card';
import Header from '../components/Header';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColor } from '../constants/theme';
import { db } from '../firebase/config';
import { styles } from '../theme';

const ScannerScreen = ({ navigation }) => {
  const colors = useThemeColor();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lockRef = useRef(false);
  const FRAME_WIDTH = 320;
  const FRAME_HEIGHT = 160;
  const lineY = useSharedValue(0);
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lineY.value }] }));

  useEffect(() => {
    lineY.value = withRepeat(
      withTiming(FRAME_HEIGHT - 2, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, [permission]);

  const handleScan = async ({ data }) => {
    if (lockRef.current || scanned) return;
    lockRef.current = true;
    setScanned(true);
    try {
      const cod = String(data).trim();
      const ref = doc(db, 'patrimonio', cod);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        navigation.replace('DetalhesItem', { cod, item: { COD: cod, ...snapshot.data() } });
      } else {
        navigation.replace('CadastroItem', { cod });
      }
    } catch (err) {
      Alert.alert('Erro no escaneamento', err.message);
      setScanned(false);
      lockRef.current = false;
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Scanner" />
        <Card>
          <Text style={styles.paragraph}>Permissão da câmera é necessária para escanear.</Text>
          <PrimaryButton title="Permitir Câmera" icon="camera" onPress={requestPermission} />
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'code93', 'upc_a', 'upc_e'],
        }}
      />

      <View style={styles.scannerOverlay}>
        <View style={styles.unfocusedArea} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.unfocusedArea} />
          <View style={[styles.scannerFocusBox, { width: FRAME_WIDTH, height: FRAME_HEIGHT }] }>
            {/* corners */}
            <View style={[styles.scannerCorner, styles.topLeft]} />
            <View style={[styles.scannerCorner, styles.topRight]} />
            <View style={[styles.scannerCorner, styles.bottomLeft]} />
            <View style={[styles.scannerCorner, styles.bottomRight]} />
            {/* scanning line */}
            <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: '100%', height: 2, backgroundColor: '#4DA3FF' }, lineStyle]} />
          </View>
          <View style={styles.unfocusedArea} />
        </View>
        <View style={[styles.unfocusedArea, { justifyContent: 'flex-start', paddingTop: 24 }] }>
          <Text style={styles.scannerHelperText}>Alinhe o código de barras/QR na caixa</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.scannerCloseButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default ScannerScreen;