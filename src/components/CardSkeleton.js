import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { styles } from '../theme';
import { useThemeColor } from '../constants/theme';

const CardSkeleton = ({ style }) => {
  const colors = useThemeColor();
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const base = { backgroundColor: colors.border, borderRadius: 8 };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, style]}>
      <Animated.View style={[{ height: 18 }, base, animatedStyle]} />
      <View style={{ height: 10 }} />
      <Animated.View style={[{ height: 12, width: '70%' }, base, animatedStyle]} />
      <View style={{ height: 8 }} />
      <Animated.View style={[{ height: 12, width: '50%' }, base, animatedStyle]} />
    </View>
  );
};

export default CardSkeleton;