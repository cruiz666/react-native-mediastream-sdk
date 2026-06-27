#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "MediastreamApp-Swift.h"

@interface MediastreamPlayerViewManager : RCTViewManager
@end

@implementation MediastreamPlayerViewManager

RCT_EXPORT_MODULE(MediastreamPlayerView)

- (UIView *)view {
  return [[MediastreamPlayerView alloc] init];
}

RCT_REMAP_VIEW_PROPERTY(id, mediaId, NSString)
RCT_EXPORT_VIEW_PROPERTY(playerId, NSString)
RCT_EXPORT_VIEW_PROPERTY(accountID, NSString)
RCT_EXPORT_VIEW_PROPERTY(type, NSString)
RCT_EXPORT_VIEW_PROPERTY(autoplay, BOOL)
RCT_EXPORT_VIEW_PROPERTY(startAt, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(volume, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(showControls, BOOL)
RCT_EXPORT_VIEW_PROPERTY(customUI, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dvr, BOOL)
RCT_EXPORT_VIEW_PROPERTY(trackEnable, BOOL)
RCT_EXPORT_VIEW_PROPERTY(customPlaylistOrigin, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(adURL, NSString)
RCT_EXPORT_VIEW_PROPERTY(accessToken, NSString)
RCT_EXPORT_VIEW_PROPERTY(environment, NSString)
RCT_EXPORT_VIEW_PROPERTY(pendingRefreshId, NSString)

RCT_EXPORT_VIEW_PROPERTY(onPlayerReady, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlay, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPause, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEnd, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onBuffering, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFullscreen, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onExitFullscreen, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAdEvent, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEpisodeInfoClick, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLockedEpisode,    RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSwipeToItem,      RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEndReached,       RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDismissButton,    RCTDirectEventBlock)

- (NSDictionary<NSString *, id> *)commandsMap {
  return @{
    @"play":        @0,
    @"pause":       @1,
    @"seekTo":      @2,
    @"setVolume":   @3,
    @"refreshFrom": @4,
  };
}

- (void)receiveCommand:(MediastreamPlayerView *)view
             commandID:(int)commandID
                  args:(NSArray *)args {
  NSLog(@"[MSManager] receiveCommand commandID=%d args=%@", commandID, args);
  switch (commandID) {
    case 0: [view play]; break;
    case 1: [view pause]; break;
    case 2: [view seekTo:[args[0] doubleValue]]; break;
    case 3: [view setVolumeLevel:[args[0] doubleValue]]; break;
    case 4: [view refreshFrom:args[0]]; break;
  }
}

@end
