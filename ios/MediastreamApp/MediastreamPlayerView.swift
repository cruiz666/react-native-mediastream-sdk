import UIKit
import MediastreamPlatformSDKxC

@objc(MediastreamPlayerView)
class MediastreamPlayerView: UIView {

    // MARK: - Props

    @objc var mediaId: String? { didSet { setupIfReady() } }
    @objc var accountID: String?
    @objc var type: String = "VOD"
    @objc var autoplay: Bool = true
    @objc var startAt: NSInteger = 0
    @objc var volume: NSInteger = -1
    @objc var showControls: Bool = true
    @objc var dvr: Bool = false
    @objc var adURL: String?

    // MARK: - Event callbacks

    @objc var onPlayerReady: RCTBubblingEventBlock?
    @objc var onPlay: RCTBubblingEventBlock?
    @objc var onPause: RCTBubblingEventBlock?
    @objc var onEnd: RCTBubblingEventBlock?
    @objc var onBuffering: RCTBubblingEventBlock?
    @objc var onError: RCTBubblingEventBlock?
    @objc var onFullscreen: RCTBubblingEventBlock?
    @objc var onExitFullscreen: RCTBubblingEventBlock?
    @objc var onAdEvent: RCTBubblingEventBlock?

    // MARK: - Private

    private var sdk: MediastreamPlatformSDK?
    private var playerInitialized = false

    // MARK: - Lifecycle

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil {
            setupIfReady()
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        sdk?.view.frame = bounds
    }

    // MARK: - Setup

    private func setupIfReady() {
        guard !playerInitialized,
              let id = mediaId, !id.isEmpty,
              let parentVC = parentViewController()
        else { return }

        playerInitialized = true

        let config = MediastreamPlayerConfig()
        config.id = id
        if let acc = accountID { config.accountID = acc }
        config.type = resolvedType()
        config.autoplay = autoplay
        if startAt > 0 { config.startAt = startAt }
        if volume >= 0 { config.volume = volume }
        config.showControls = showControls
        config.dvr = dvr
        if let ad = adURL { config.adURL = ad }

        let player = MediastreamPlatformSDK()
        sdk = player

        player.events.listenTo(eventName: "ready") { [weak self] in
            self?.onPlayerReady?([:])
        }
        player.events.listenTo(eventName: "play") { [weak self] in
            self?.onPlay?([:])
        }
        player.events.listenTo(eventName: "pause") { [weak self] in
            self?.onPause?([:])
        }
        player.events.listenTo(eventName: "finish") { [weak self] in
            self?.onEnd?([:])
        }
        player.events.listenTo(eventName: "buffering") { [weak self] in
            self?.onBuffering?([:])
        }
        player.events.listenTo(eventName: "error") { [weak self] (info: Any?) in
            let msg = info as? String ?? "unknown"
            self?.onError?(["error": msg])
        }
        player.events.listenTo(eventName: "onFullscreen") { [weak self] in
            self?.onFullscreen?([:])
        }
        player.events.listenTo(eventName: "offFullscreen") { [weak self] in
            self?.onExitFullscreen?([:])
        }
        player.events.listenTo(eventName: "onAdEvent") { [weak self] (info: Any?) in
            let eventType = info as? String ?? ""
            self?.onAdEvent?(["type": eventType])
        }

        parentVC.addChild(player)
        addSubview(player.view)
        player.view.frame = bounds
        player.didMove(toParent: parentVC)

        player.setup(config)
    }

    // MARK: - Commands

    @objc func play() { sdk?.play() }
    @objc func pause() { sdk?.pause() }
    @objc func seekTo(_ seconds: Double) { sdk?.seekTo(seconds) }
    @objc func setVolumeLevel(_ vol: Double) { sdk?.setVolume(volume: Int(vol * 100)) }

    // MARK: - Helpers

    private func resolvedType() -> MediastreamPlayerConfig.VideoTypes {
        switch type.uppercased() {
        case "LIVE":    return .LIVE
        case "EPISODE": return .EPISODE
        default:        return .VOD
        }
    }

    private func parentViewController() -> UIViewController? {
        var responder: UIResponder? = self
        while let r = responder {
            if let vc = r as? UIViewController { return vc }
            responder = r.next
        }
        return nil
    }

    // MARK: - Cleanup

    override func removeFromSuperview() {
        sdk?.pause()
        sdk?.willMove(toParent: nil)
        sdk?.view.removeFromSuperview()
        sdk?.removeFromParent()
        sdk = nil
        playerInitialized = false
        super.removeFromSuperview()
    }
}
