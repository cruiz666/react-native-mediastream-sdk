export type VideoType = 'VOD' | 'LIVE' | 'EPISODE' | 'VERTICAL';

export interface MediastreamPlayerProps {
  // Required
  id: string;
  accountID?: string;
  type: VideoType;

  // Optional config
  autoplay?: boolean;
  startAt?: number;
  volume?: number;      // 0.0 – 1.0
  showControls?: boolean;
  dvr?: boolean;
  playerId?: string;
  adURL?: string;
  accessToken?: string;
  environment?: string;
  customUI?: boolean;
  isDebug?: boolean;
  trackEnable?: boolean;
  customPlaylistOrigin?: {
    baseUrl: string;
    headers?: Record<string, string>;
    startFromMediaId?: string;
  };

  // iOS-only prop for refreshFrom (command dispatch unreliable in RN 0.73 iOS)
  pendingRefreshId?: string;

  style?: object;

  // Event callbacks
  onPlayerReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onBuffering?: () => void;
  onError?: (event: {nativeEvent: {error: string | null}}) => void;
  onFullscreen?: () => void;
  onExitFullscreen?: () => void;
  onAdEvent?: (event: {nativeEvent: {type: string}}) => void;
  onEpisodeInfoClick?: (event: {nativeEvent: {order: number; id?: string; [key: string]: unknown}}) => void;
  onLockedEpisode?: (event: {nativeEvent: {episodeId: string}}) => void;
  onSwipeToItem?: (event: {nativeEvent: {itemId: string}}) => void;
  onEndReached?: () => void;
  onDismissButton?: () => void;
}

export interface MediastreamPlayerCommands {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  setVolume(volume: number): void;
  refreshFrom(mediaId: string): void;
}
