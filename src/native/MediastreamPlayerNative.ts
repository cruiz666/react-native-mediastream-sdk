import {requireNativeComponent} from 'react-native';
import type {MediastreamPlayerProps} from './types';

export const MediastreamPlayerViewNative =
  requireNativeComponent<MediastreamPlayerProps>('MediastreamPlayerView');

export const PlayerCommands = {
  play: 'play',
  pause: 'pause',
  seekTo: 'seekTo',
  setVolume: 'setVolume',
} as const;
