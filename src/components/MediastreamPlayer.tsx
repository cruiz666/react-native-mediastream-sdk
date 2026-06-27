import React, {forwardRef, useImperativeHandle, useRef, useCallback, useState} from 'react';
import {Platform, StatusBar, UIManager, findNodeHandle} from 'react-native';
import {MediastreamPlayerViewNative, PlayerCommands, PlayerCommandIdsIOS} from '../native/MediastreamPlayerNative';
import type {MediastreamPlayerProps, MediastreamPlayerCommands} from '../native/types';

type Props = MediastreamPlayerProps & {
  style?: object;
};

export const MediastreamPlayer = forwardRef<MediastreamPlayerCommands, Props>(
  (props, ref) => {
    const {onFullscreen: onFullscreenProp, onExitFullscreen: onExitFullscreenProp, style, ...rest} = props;
    const nativeRef = useRef<any>(null);
    const [pendingRefreshId, setPendingRefreshId] = useState<string | undefined>(undefined);

    function dispatchCommand(command: string, args: unknown[] = []) {
      const node = findNodeHandle(nativeRef.current);
      // iOS Old Architecture: UIManager introspection doesn't reliably expose
      // commandsMap in RN 0.73, so we use a static numeric map kept in sync
      // with MediastreamPlayerViewManager.m commandsMap.
      const commandId: string | number =
        Platform.OS === 'ios' ? (PlayerCommandIdsIOS[command] ?? command) : command;
      console.log(`[MSBridge] dispatchCommand command=${command} commandId=${commandId} node=${node}`);
      if (node) {
        UIManager.dispatchViewManagerCommand(node, commandId as any, args);
      } else {
        console.warn('[MSBridge] dispatchCommand — node is null, ref not mounted?');
      }
    }

    useImperativeHandle(ref, () => ({
      play: () => dispatchCommand(PlayerCommands.play),
      pause: () => dispatchCommand(PlayerCommands.pause),
      seekTo: (seconds: number) => dispatchCommand(PlayerCommands.seekTo, [seconds]),
      setVolume: (volume: number) => dispatchCommand(PlayerCommands.setVolume, [volume]),
      refreshFrom: (mediaId: string) => {
        if (Platform.OS === 'ios') {
          // iOS: use prop-based trigger; append nonce so same ID re-triggers
          setPendingRefreshId(`${mediaId}|${Date.now()}`);
        } else {
          dispatchCommand(PlayerCommands.refreshFrom, [mediaId]);
        }
      },
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
        pendingRefreshId={pendingRefreshId}
        {...rest}
      />
    );
  },
);
