import React, {useRef} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MediastreamPlayer} from './src/components/MediastreamPlayer';
import {DummyContent} from './src/components/DummyContent';
import type {MediastreamPlayerCommands} from './src/native/types';

const MEDIA_ID = '69e40fa9d0cf9540a9c76b56';

export default function App() {
  const playerRef = useRef<MediastreamPlayerCommands>(null);
  const {width} = useWindowDimensions();
  const playerHeight = Math.round(width * (9 / 16));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
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
          autoplay={true}
          showControls={true}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
