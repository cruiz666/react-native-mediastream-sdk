import React, {forwardRef, useImperativeHandle, useRef, useCallback} from 'react';
import {StatusBar, UIManager, findNodeHandle} from 'react-native';
import {MediastreamPlayerViewNative, PlayerCommands} from '../native/MediastreamPlayerNative';
import type {MediastreamPlayerProps, MediastreamPlayerCommands} from '../native/types';

type Props = MediastreamPlayerProps & {
  style?: object;
};

export const MediastreamPlayer = forwardRef<MediastreamPlayerCommands, Props>(
  (props, ref) => {
    const {onFullscreen: onFullscreenProp, onExitFullscreen: onExitFullscreenProp, style, ...rest} = props;
    const nativeRef = useRef<any>(null);

    function dispatchCommand(command: string, args: unknown[] = []) {
      const node = findNodeHandle(nativeRef.current);
      if (node) {
        UIManager.dispatchViewManagerCommand(node, command, args);
      }
    }

    useImperativeHandle(ref, () => ({
      play: () => dispatchCommand(PlayerCommands.play),
      pause: () => dispatchCommand(PlayerCommands.pause),
      seekTo: (seconds: number) => dispatchCommand(PlayerCommands.seekTo, [seconds]),
      setVolume: (volume: number) => dispatchCommand(PlayerCommands.setVolume, [volume]),
    }));

    const handleFullscreen = useCallback(() => {
      StatusBar.setHidden(true, 'fade');
      onFullscreenProp?.();
    }, [onFullscreenProp]);

    const handleExitFullscreen = useCallback(() => {
      StatusBar.setHidden(false, 'fade');
      onExitFullscreenProp?.();
    }, [onExitFullscreenProp]);

    // The SDK handles fullscreen presentation entirely on the native side.
    // No JS-side layout change needed — adding zIndex/absolute positioning here
    // causes React Native to reorder views (remove + re-add) which crashes with
    // "child already has a parent" during the orientation transition.
    return (
      <MediastreamPlayerViewNative
        ref={nativeRef}
        style={style}
        onFullscreen={handleFullscreen}
        onExitFullscreen={handleExitFullscreen}
        {...rest}
      />
    );
  },
);
