import { useColorScheme } from 'react-native';

export const LightColors = {
  primary: '#0A2540',
  accent: '#007BFF',
  background: '#F8F9FA',
  text: '#212529',
  subtleText: '#6c757d',
  success: '#28a745',
  error: '#E63946',
  card: '#FFFFFF',
  border: '#DEE2E6',
};

export const DarkColors = {
  primary: '#E6F0FF',
  accent: '#4DA3FF',
  background: '#0F1117',
  text: '#EAEAEA',
  subtleText: '#9AA0A6',
  success: '#33D17A',
  error: '#FF6B6B',
  card: '#1A1D22',
  border: '#2A2F36',
};

export const useThemeColor = () => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : LightColors;
};