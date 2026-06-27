import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

type Screen = 'small-container' | 'micro-dramas';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function HomeScreen({onNavigate}: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <Text style={styles.title}>Mediastream SDK</Text>
        <Text style={styles.subtitle}>Selecciona una demo</Text>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => onNavigate('small-container')}>
          <Text style={styles.cardTitle}>Small Container</Text>
          <Text style={styles.cardDesc}>Player VOD / Live con scroll</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardSecondary]}
          activeOpacity={0.75}
          onPress={() => onNavigate('micro-dramas')}>
          <Text style={styles.cardTitle}>Micro Dramas</Text>
          <Text style={styles.cardDesc}>Vertical Player · Lock/Unlock demo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3A3A5A',
  },
  cardSecondary: {
    borderColor: '#4A3F8F',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDesc: {
    color: '#888',
    fontSize: 13,
  },
});
