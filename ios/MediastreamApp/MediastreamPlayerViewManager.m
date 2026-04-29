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

RCT_EXPORT_VIEW_PROPERTY(mediaId, NSString)
RCT_EXPORT_VIEW_PROPERTY(accountID, NSString)
RCT_EXPORT_VIEW_PROPERTY(type, NSString)
RCT_EXPORT_VIEW_PROPERTY(autoplay, BOOL)
RCT_EXPORT_VIEW_PROPERTY(startAt, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(volume, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(showControls, BOOL)
RCT_EXPORT_VIEW_PROPERTY(dvr, BOOL)
RCT_EXPORT_VIEW_PROPERTY(adURL, NSString)

RCT_EXPORT_VIEW_PROPERTY(onPlayerReady, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlay, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPause, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEnd, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onBuffering, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFullscreen, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onExitFullscreen, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAdEvent, RCTBubblingEventBlock)

- (NSDictionary<NSString *, id> *)commandsMap {
  return @{
    @"play":      @0,
    @"pause":     @1,
    @"seekTo":    @2,
    @"setVolume": @3,
  };
}

- (void)receiveCommand:(MediastreamPlayerView *)view
             commandID:(int)commandID
                  args:(NSArray *)args {
  switch (commandID) {
    case 0: [view play]; break;
    case 1: [view pause]; break;
    case 2: [view seekTo:[args[0] doubleValue]]; break;
    case 3: [view setVolumeLevel:[args[0] doubleValue]]; break;
  }
}

@end
