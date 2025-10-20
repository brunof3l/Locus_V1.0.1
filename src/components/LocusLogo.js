import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../theme';

const LocusLogo = () => (
  <View style={styles.logoContainer}>
    <Text style={styles.logoText}>L</Text>
    <View style={styles.logoO}>
      <View style={styles.logoOInner} />
    </View>
    <Text style={styles.logoText}>CUS</Text>
  </View>
);

export default LocusLogo;