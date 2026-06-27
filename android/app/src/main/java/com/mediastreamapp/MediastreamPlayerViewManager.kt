package com.mediastreamapp

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class MediastreamPlayerViewManager : SimpleViewManager<MediastreamPlayerView>() {

    override fun getName(): String = "MediastreamPlayerView"

    override fun createViewInstance(context: ThemedReactContext): MediastreamPlayerView =
        MediastreamPlayerView(context)

    // Required props — player initializes once both accountID and id are set
    @ReactProp(name = "accountID")
    fun setAccountID(view: MediastreamPlayerView, accountID: String?) {
        view.accountID = accountID
        view.initPlayer()
    }

    @ReactProp(name = "id")
    fun setId(view: MediastreamPlayerView, id: String?) {
        view.mediaId = id
        view.initPlayer()
    }

    @ReactProp(name = "playerId")
    fun setPlayerId(view: MediastreamPlayerView, playerId: String?) {
        view.playerId = playerId
    }

    // Optional config props
    @ReactProp(name = "type")
    fun setType(view: MediastreamPlayerView, type: String?) {
        view.mediaType = type ?: "VOD"
    }

    @ReactProp(name = "autoplay", defaultBoolean = true)
    fun setAutoplay(view: MediastreamPlayerView, autoplay: Boolean) {
        view.autoplay = autoplay
    }

    @ReactProp(name = "startAt", defaultInt = -1)
    fun setStartAt(view: MediastreamPlayerView, startAt: Int) {
        view.startAt = startAt
    }

    @ReactProp(name = "volume", defaultFloat = -1f)
    fun setVolume(view: MediastreamPlayerView, volume: Float) {
        view.volume = volume
    }

    @ReactProp(name = "showControls", defaultBoolean = true)
    fun setShowControls(view: MediastreamPlayerView, showControls: Boolean) {
        view.showControls = showControls
    }

    @ReactProp(name = "dvr", defaultBoolean = false)
    fun setDvr(view: MediastreamPlayerView, dvr: Boolean) {
        view.dvr = dvr
    }

    @ReactProp(name = "adURL")
    fun setAdURL(view: MediastreamPlayerView, adURL: String?) {
        view.adURL = adURL
    }

    @ReactProp(name = "accessToken")
    fun setAccessToken(view: MediastreamPlayerView, accessToken: String?) {
        view.accessToken = accessToken
    }

    @ReactProp(name = "environment")
    fun setEnvironment(view: MediastreamPlayerView, environment: String?) {
        view.environment = environment
    }

    @ReactProp(name = "isDebug", defaultBoolean = false)
    fun setIsDebug(view: MediastreamPlayerView, isDebug: Boolean) {
        view.isDebug = isDebug
    }

    @ReactProp(name = "trackEnable", defaultBoolean = true)
    fun setTrackEnable(view: MediastreamPlayerView, trackEnable: Boolean) {
        view.trackEnable = trackEnable
    }

    @ReactProp(name = "customPlaylistOrigin")
    fun setCustomPlaylistOrigin(view: MediastreamPlayerView, origin: ReadableMap?) {
        view.customPlaylistBaseUrl = origin?.getString("baseUrl")
        view.customPlaylistStartFromMediaId = origin?.getString("startFromMediaId")
        @Suppress("UNCHECKED_CAST")
        view.customPlaylistHeaders = origin?.getMap("headers")?.toHashMap()
            ?.mapValues { it.value.toString() }
    }

    // Imperative commands dispatched via UIManager.dispatchViewManagerCommand from JS
    override fun getCommandsMap(): Map<String, Int> = mapOf(
        "play"        to CMD_PLAY,
        "pause"       to CMD_PAUSE,
        "seekTo"      to CMD_SEEK_TO,
        "setVolume"   to CMD_SET_VOLUME,
        "refreshFrom" to CMD_REFRESH_FROM,
    )

    override fun receiveCommand(
        view: MediastreamPlayerView,
        commandId: String,
        args: ReadableArray?
    ) {
        when (commandId) {
            "play"        -> view.play()
            "pause"       -> view.pause()
            "seekTo"      -> args?.getDouble(0)?.let { view.seekTo(it) }
            "setVolume"   -> args?.getDouble(0)?.let { view.setVolumeLevel(it) }
            "refreshFrom" -> args?.getString(0)?.let { view.refreshFrom(it) }
        }
    }

    // Events exported so RN knows to bridge them as callback props
    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> = mapOf(
        "onPlayerReady"      to mapOf("registrationName" to "onPlayerReady"),
        "onPlay"             to mapOf("registrationName" to "onPlay"),
        "onPause"            to mapOf("registrationName" to "onPause"),
        "onEnd"              to mapOf("registrationName" to "onEnd"),
        "onBuffering"        to mapOf("registrationName" to "onBuffering"),
        "onError"            to mapOf("registrationName" to "onError"),
        "onFullscreen"       to mapOf("registrationName" to "onFullscreen"),
        "onExitFullscreen"   to mapOf("registrationName" to "onExitFullscreen"),
        "onAdEvent"          to mapOf("registrationName" to "onAdEvent"),
        "onEpisodeInfoClick" to mapOf("registrationName" to "onEpisodeInfoClick"),
        "onLockedEpisode"    to mapOf("registrationName" to "onLockedEpisode"),
        "onSwipeToItem"      to mapOf("registrationName" to "onSwipeToItem"),
        "onEndReached"       to mapOf("registrationName" to "onEndReached"),
        "onDismissButton"    to mapOf("registrationName" to "onDismissButton"),
    )

    private companion object {
        const val CMD_PLAY         = 1
        const val CMD_PAUSE        = 2
        const val CMD_SEEK_TO      = 3
        const val CMD_SET_VOLUME   = 4
        const val CMD_REFRESH_FROM = 5
    }
}
