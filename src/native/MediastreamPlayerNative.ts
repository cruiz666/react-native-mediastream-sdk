import {requireNativeComponent} from 'react-native';
import type {MediastreamPlayerProps} from './types';

export const MediastreamPlayerViewNative =
  requireNativeComponent<MediastreamPlayerProps>('MediastreamPlayerView');

// String names used by Android (receiveCommand takes String commandId)
export const PlayerCommands = {
  play: 'play',
  pause: 'pause',
  seekTo: 'seekTo',
  setVolume: 'setVolume',
  refreshFrom: 'refreshFrom',
} as const;

// iOS Old Architecture requires the integer from ObjC commandsMap —
// UIManager introspection is unreliable in RN 0.73, so we keep them in sync manually.
// Must match the numbers in MediastreamPlayerViewManager.m commandsMap exactly.
export const PlayerCommandIdsIOS: Record<string, number> = {
  play: 0,
  pause: 1,
  seekTo: 2,
  setVolume: 3,
  refreshFrom: 4,
};
