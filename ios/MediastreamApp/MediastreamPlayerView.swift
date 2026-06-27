import UIKit
import MediastreamPlatformSDKiOS

@objc(MediastreamPlayerView)
class MediastreamPlayerView: UIView {

    // MARK: - Props

    @objc var mediaId: String? { didSet { setupIfReady() } }
    @objc var playerId: String?
    @objc var accountID: String?
    @objc var type: String = "VOD"
    @objc var autoplay: Bool = true
    @objc var startAt: NSInteger = 0
    @objc var volume: NSInteger = -1
    @objc var showControls: Bool = true
    @objc var customUI: Bool = false
    @objc var dvr: Bool = false
    @objc var trackEnable: Bool = true
    @objc var customPlaylistOrigin: NSDictionary?
    @objc var adURL: String?
    @objc var accessToken: String?
    @objc var environment: String?
    // Prop-based command for iOS (commandsMap dispatch is unreliable in RN 0.73).
    // Format: "mediaId|nonce" — nonce ensures re-trigger for the same ID.
    @objc var pendingRefreshId: String? {
        didSet {
            guard let raw = pendingRefreshId, !raw.isEmpty else { return }
            let id = raw.components(separatedBy: "|").first ?? raw
            if let s = sdk {
                NSLog("[MSPlayer] pendingRefreshId → refreshFrom(\(id)) sdk=exists")
                s.refreshFrom(mediaId: id)
                NSLog("[MSPlayer] refreshFrom dispatched")
            } else {
                NSLog("[MSPlayer] pendingRefreshId → refreshFrom(\(id)) sdk=NIL — skipped")
            }
        }
    }

    // MARK: - Event callbacks

    @objc var onPlayerReady: RCTDirectEventBlock?
    @objc var onPlay: RCTDirectEventBlock?
    @objc var onPause: RCTDirectEventBlock?
    @objc var onEnd: RCTDirectEventBlock?
    @objc var onBuffering: RCTDirectEventBlock?
    @objc var onError: RCTDirectEventBlock?
    @objc var onFullscreen: RCTDirectEventBlock?
    @objc var onExitFullscreen: RCTDirectEventBlock?
    @objc var onAdEvent: RCTDirectEventBlock?
    @objc var onEpisodeInfoClick: RCTDirectEventBlock?
    @objc var onLockedEpisode: RCTDirectEventBlock?
    @objc var onSwipeToItem: RCTDirectEventBlock?
    @objc var onEndReached: RCTDirectEventBlock?
    @objc var onDismissButton: RCTDirectEventBlock?

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
        sdk?.view.setNeedsLayout()
    }

    // MARK: - Setup

    private func setupIfReady() {
        NSLog("[MSPlayer] setupIfReady called — initialized=\(playerInitialized) mediaId=\(mediaId ?? "nil") window=\(window != nil) parentVC=\(String(describing: parentViewController()))")
        guard !playerInitialized,
              let id = mediaId, !id.isEmpty,
              let parentVC = parentViewController()
        else { return }

        NSLog("[MSPlayer] proceeding with setup id=\(id)")
        playerInitialized = true

        let config = MediastreamPlayerConfig()
        config.id = id
        if let pid = playerId { config.playerId = pid }
        if let acc = accountID { config.accountID = acc }
        config.type = resolvedType()
        config.autoplay = autoplay
        if startAt > 0 { config.startAt = startAt }
        if volume >= 0 { config.volume = volume }
        config.showControls = showControls
        config.customUI = customUI
        config.dvr = dvr
        config.trackEnable = trackEnable
        if let origin = customPlaylistOrigin,
           let baseUrl = origin["baseUrl"] as? String {
            let headers = origin["headers"] as? [String: String]
            let startFromId = origin["startFromMediaId"] as? String
            let playlist = MediastreamPlayerConfig.CustomPlaylistOrigin(
                baseUrl: baseUrl,
                headers: headers ?? [:],
                startFromMediaId: startFromId
            )
            config.customPlaylistOrigin = playlist
        }
        if let ad = adURL { config.adURL = ad }
        if let token = accessToken { config.accessToken = token }
        if let env = environment {
            config.environment = env.uppercased() == "DEV"
                ? .DEV
                : .PRODUCTION
        }

        let player = MediastreamPlatformSDK()
        sdk = player

        player.events.listenTo(eventName: "ready") { [weak self] in
            NSLog("[MSPlayer] event: ready")
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
            NSLog("[MSPlayer] event: error — \(msg)")
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
        player.events.listenTo(eventName: "onEpisodeInfoClick") { [weak self] (info: Any?) in
            NSLog("[MSPlayer] event: onEpisodeInfoClick — \(String(describing: info))")
            var payload: [String: Any] = [:]
            if let dict = info as? [String: Any] {
                payload = dict
            } else if let order = info as? Int {
                payload = ["order": order]
            }
            self?.onEpisodeInfoClick?(payload)
        }
        player.events.listenTo(eventName: "onLockedEpisode") { [weak self] (info: Any?) in
            let id = info as? String ?? ""
            self?.onLockedEpisode?(["episodeId": id])
        }
        player.events.listenTo(eventName: "onSwipeToItem") { [weak self] (info: Any?) in
            let id = info as? String ?? ""
            self?.onSwipeToItem?(["itemId": id])
        }
        player.events.listenTo(eventName: "onEndReached") { [weak self] _ in
            self?.onEndReached?([:])
        }
        player.events.listenTo(eventName: "onDismissButton") { [weak self] _ in
            self?.onDismissButton?([:])
        }

        parentVC.addChild(player)
        addSubview(player.view)
        player.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            player.view.leadingAnchor.constraint(equalTo: leadingAnchor),
            player.view.trailingAnchor.constraint(equalTo: trailingAnchor),
            player.view.topAnchor.constraint(equalTo: topAnchor),
            player.view.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
        player.didMove(toParent: parentVC)

        NSLog("[MSPlayer] calling setup — accountID=\(config.accountID ?? "nil") env=\(String(describing: config.environment))")
        player.setup(config)
    }

    // MARK: - Commands

    @objc func play() { sdk?.play() }
    @objc func pause() { sdk?.pause() }
    @objc func seekTo(_ seconds: Double) { sdk?.seekTo(seconds) }
    @objc func setVolumeLevel(_ vol: Double) { /* setVolume not available in this SDK version */ }
    @objc func refreshFrom(_ mediaId: String) {
        NSLog("[MSPlayer] refreshFrom called — mediaId=\(mediaId) sdk=\(sdk != nil ? "exists" : "nil")")
        sdk?.refreshFrom(mediaId: mediaId)
        NSLog("[MSPlayer] refreshFrom — sdk call dispatched")
    }

    // MARK: - Helpers

    private func resolvedType() -> MediastreamPlayerConfig.VideoTypes {
        switch type.uppercased() {
        case "LIVE":     return .LIVE
        case "EPISODE":  return .EPISODE
        case "VERTICAL": return .VERTICAL
        default:         return .VOD
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
