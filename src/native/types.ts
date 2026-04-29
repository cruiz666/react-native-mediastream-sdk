export type VideoType = 'VOD' | 'LIVE' | 'EPISODE';

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
  adURL?: string;

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
}

export interface MediastreamPlayerCommands {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  setVolume(volume: number): void;
}
