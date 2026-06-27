import React, {useRef} from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MediastreamPlayer} from '../components/MediastreamPlayer';
import {DummyContent} from '../components/DummyContent';
import type {MediastreamPlayerCommands} from '../native/types';

const MEDIA_ID = '6a2ab14ca4a10f58e857f39d';

interface Props {
  onBack: () => void;
}

export function SmallContainerScreen({onBack}: Props) {
  const playerRef = useRef<MediastreamPlayerCommands>(null);
  const {width} = useWindowDimensions();
  const playerHeight = Math.round(width * (9 / 16));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Small Container</Text>
        <View style={{width: 60}} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <MediastreamPlayer
          ref={playerRef}
          style={{width, height: playerHeight}}
          id={MEDIA_ID}
          type="VOD"
          environment="DEV"
          // accessToken="G4ct11JhjaIVEPthLlrxEtMJ78XV2VgN4b2O6t76owVVMVYsNPpl1V1NOBCZ3Os975BkXCbZhZK"
          autoplay={true}
          showControls={true}
          customUI={Platform.OS === 'ios'}
          onPlayerReady={() => console.log('[Mediastream] Player ready')}
          onPlay={() => console.log('[Mediastream] Playing')}
          onPause={() => console.log('[Mediastream] Paused')}
          onEnd={() => console.log('[Mediastream] Ended')}
          onBuffering={() => console.log('[Mediastream] Buffering')}
          onError={e => console.warn('[Mediastream] Error:', e.nativeEvent.error)}
          onAdEvent={e => console.log('[Mediastream] Ad event:', e.nativeEvent.type)}
        />
        <DummyContent />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0F1A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  back: {
    color: '#888',
    fontSize: 15,
    width: 60,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
