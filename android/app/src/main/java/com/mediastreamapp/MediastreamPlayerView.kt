package com.mediastreamapp

import am.mediastre.mediastreamplatformsdkandroid.MediastreamMiniPlayerConfig
import am.mediastre.mediastreamplatformsdkandroid.MediastreamPlayer
import am.mediastre.mediastreamplatformsdkandroid.MediastreamPlayerCallback
import am.mediastre.mediastreamplatformsdkandroid.MediastreamPlayerConfig
import android.content.Context
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.fragment.app.FragmentActivity
import androidx.media3.ui.PlayerView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.google.ads.interactivemedia.v3.api.AdError
import com.google.ads.interactivemedia.v3.api.AdEvent
import org.json.JSONObject

class MediastreamPlayerView(context: Context) : FrameLayout(context) {

    private val reactContext = context as ReactContext
    private val mainHandler = Handler(Looper.getMainLooper())

    private var player: MediastreamPlayer? = null
    private var playerInitialized = false
    var isFullscreen = false

    // The actual player lives here, in the decorView — outside the RN view tree.
    // MediastreamPlayerView is just a transparent placeholder that reserves space
    // and provides positioning info.
    private var overlayContainer: FrameLayout? = null

    // Props set by the ViewManager before attach
    var accountID: String? = null
    var mediaId: String? = null
    var playerId: String? = null
    var mediaType: String = "VOD"
    var autoplay: Boolean = true
    var startAt: Int = -1
    var volume: Float = -1f
    var showControls: Boolean = true
    var dvr: Boolean = false
    var isDebug: Boolean = false
    var trackEnable: Boolean = true
    var customPlaylistBaseUrl: String? = null
    var customPlaylistStartFromMediaId: String? = null
    var customPlaylistHeaders: Map<String, String>? = null
    var adURL: String? = null
    var accessToken: String? = null
    var environment: String? = null

    private val scrollListener = ViewTreeObserver.OnScrollChangedListener {
        if (!isFullscreen) syncOverlayToPlaceholder()
    }

    // Sync overlay position whenever this placeholder lays out (resize, first layout, etc.)
    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        super.onLayout(changed, l, t, r, b)
        if (!isFullscreen) syncOverlayToPlaceholder()
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        activeInstance = this
        viewTreeObserver.addOnScrollChangedListener(scrollListener)
        if (overlayContainer == null) createOverlay()
        initPlayer()
    }

    private fun createOverlay() {
        val decorView = reactContext.currentActivity?.window?.decorView as? ViewGroup ?: return

        // The overlay FrameLayout mirrors the SDK-container responsibilities that
        // MediastreamPlayerView used to hold directly.
        val overlay = object : FrameLayout(context) {
            private val measureAndLayout = Runnable {
                measure(
                    MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
                )
                layout(left, top, right, bottom)
            }

            // SDK re-adds its views during orientation changes; detach first to avoid
            // "child already has a parent" crashes.
            override fun addView(child: View, index: Int, params: ViewGroup.LayoutParams) {
                (child.parent as? ViewGroup)?.removeView(child)
                super.addView(child, index, params)
            }

            // RN bypasses Android layout; force re-measure when SDK adds child views.
            override fun requestLayout() {
                super.requestLayout()
                post(measureAndLayout)
            }
        }

        // Start at a 1×1 placeholder — syncOverlayToPlaceholder() will size it correctly
        // once this view completes its first layout pass.
        val lp = FrameLayout.LayoutParams(1, 1).apply {
            gravity = Gravity.TOP or Gravity.START
        }
        decorView.addView(overlay, lp)
        // Ensure the overlay sits above the ReactRootView.
        overlay.elevation = 1f
        overlayContainer = overlay
        syncOverlayToPlaceholder()
    }

    // Resize and reposition the overlay to exactly match this placeholder view.
    private fun syncOverlayToPlaceholder() {
        val overlay = overlayContainer ?: return
        if (width == 0 || height == 0) return

        val loc = IntArray(2)
        getLocationInWindow(loc)

        val lp = overlay.layoutParams as? FrameLayout.LayoutParams ?: return
        if (lp.leftMargin == loc[0] && lp.topMargin == loc[1]
            && lp.width == width && lp.height == height) return

        lp.leftMargin = loc[0]
        lp.topMargin = loc[1]
        lp.width = width
        lp.height = height
        overlay.layoutParams = lp
    }

    fun initPlayer() {
        if (playerInitialized) return
        val id = mediaId ?: run { Log.d(TAG, "initPlayer: mediaId not set yet"); return }
        val activity = reactContext.currentActivity as? FragmentActivity
            ?: run { Log.e(TAG, "initPlayer: currentActivity is null or not FragmentActivity"); return }
        val overlay = overlayContainer
            ?: run { Log.d(TAG, "initPlayer: overlay not ready yet, will retry on attach"); return }

        Log.d(TAG, "initPlayer: starting id=$id")
        playerInitialized = true

        val config = MediastreamPlayerConfig().apply {
            accountID?.let { this.accountID = it }
            this.id = id
            this@MediastreamPlayerView.playerId?.let { this.playerId = it }
            type = when (mediaType.uppercase()) {
                "LIVE"     -> MediastreamPlayerConfig.VideoTypes.LIVE
                "EPISODE"  -> MediastreamPlayerConfig.VideoTypes.EPISODE
                "VERTICAL" -> MediastreamPlayerConfig.VideoTypes.VERTICAL
                else       -> MediastreamPlayerConfig.VideoTypes.VOD
            }
            autoplay = this@MediastreamPlayerView.autoplay
            if (this@MediastreamPlayerView.startAt >= 0) startAt = this@MediastreamPlayerView.startAt
            if (this@MediastreamPlayerView.volume >= 0f) volume = this@MediastreamPlayerView.volume * 100f
            showControls = this@MediastreamPlayerView.showControls
            dvr = this@MediastreamPlayerView.dvr
            isDebug = this@MediastreamPlayerView.isDebug
            trackEnable = this@MediastreamPlayerView.trackEnable
            this@MediastreamPlayerView.customPlaylistBaseUrl?.let { baseUrl ->
                customPlaylistOrigin = MediastreamPlayerConfig.CustomPlaylistOrigin(
                    baseUrl = baseUrl,
                    headers = this@MediastreamPlayerView.customPlaylistHeaders ?: emptyMap(),
                    startFromMediaId = this@MediastreamPlayerView.customPlaylistStartFromMediaId
                )
            }
            adURL = this@MediastreamPlayerView.adURL
            this@MediastreamPlayerView.accessToken?.let { accessToken = it }
            this@MediastreamPlayerView.environment?.let {
                environment = if (it.uppercase() == "DEV") MediastreamPlayerConfig.Environment.DEV
                              else MediastreamPlayerConfig.Environment.PRODUCTION
            }
            // VERTICAL mode manages its own ViewPager with per-episode players — do NOT
            // provide customPlayerView (it would be reused across all episodes, breaking
            // navigation) and do NOT intercept fullscreen clicks (not applicable).
            if (mediaType.uppercase() != "VERTICAL") {
                appHandlesWindowInsets = true
                customPlayerView = LayoutInflater.from(context)
                    .inflate(R.layout.ms_player_texture, null) as androidx.media3.ui.PlayerView
                onFullscreenOnClick = java.util.function.Consumer { _ ->
                    enterFakeFullscreen()
                    sendEvent("onFullscreen", null)
                }
                onFullscreenOffClick = java.util.function.Consumer { _ ->
                    exitFakeFullscreen()
                    sendEvent("onExitFullscreen", null)
                }
            }
        }

        // The SDK sets msplayerView = customPlayerView but does NOT add it to the container
        // when customPlayerView is provided — we must add it ourselves.
        val customView = config.customPlayerView
        if (customView != null) {
            overlay.addView(
                customView,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )
        }

        player = MediastreamPlayer(
            context,
            config,
            overlay,
            overlay,
            activity.supportFragmentManager
        ).also { p ->
            p.addPlayerCallback(createCallback())
            // p.addFullscreenOverlay(buildHelloOverlay())
        }
    }

    // Called by MainActivity.onConfigurationChanged — no-op in fake-fullscreen mode
    // since we never change requestedOrientation.
    fun handleConfigChange(newConfig: Configuration) {}

    // Imperative commands from JS
    fun play() { player?.play() }
    fun pause() { player?.pause() }
    fun seekTo(seconds: Double) { player?.seekTo((seconds * 1000).toLong()) }
    fun setVolumeLevel(vol: Double) { player?.setSessionVolume(vol.toFloat()) }
    fun refreshFrom(mediaId: String) {
        Log.d(TAG, "refreshFrom: $mediaId")
        player?.refreshFrom(mediaId)
        // SDK loads the new episode but doesn't autoplay — trigger play after it settles.
        mainHandler.postDelayed({ player?.play() }, 800)
    }

    private fun enterFakeFullscreen() {
        if (isFullscreen) return
        isFullscreen = true
        val activity = reactContext.currentActivity ?: return
        val overlay = overlayContainer ?: return
        val decorView = activity.window.decorView as? ViewGroup ?: return
        val dm = resources.displayMetrics
        val screenW = dm.widthPixels
        val screenH = dm.heightPixels

        // Give the overlay landscape dimensions centered in the portrait screen.
        // leftMargin is negative (extends off-screen left/right) — that's intentional.
        // After -90° rotation the landscape rectangle fills the portrait screen exactly,
        // with no non-uniform scale, so Media3 sees a landscape container and renders
        // the video without any distortion.
        val lp = overlay.layoutParams as? FrameLayout.LayoutParams ?: return
        lp.width = screenH
        lp.height = screenW
        lp.leftMargin = (screenW - screenH) / 2   // negative
        lp.topMargin  = (screenH - screenW) / 2
        overlay.layoutParams = lp
        overlay.bringToFront()
        overlay.elevation = 100f

        // Allow the overlay to render its off-screen portions before rotation.
        decorView.clipChildren = false
        decorView.clipToPadding = false

        WindowInsetsControllerCompat(activity.window, overlay).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        // Lock portrait so a physical tilt doesn't also rotate the Activity.
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT

        overlay.post {
            // Pivot at overlay center — rotate the whole landscape container -90°, no scale.
            overlay.pivotX = screenH / 2f
            overlay.pivotY = screenW / 2f
            overlay.animate()
                .rotation(90f)
                .setDuration(250)
                .start()
        }
    }

    private fun exitFakeFullscreen() {
        if (!isFullscreen) return
        isFullscreen = false
        val activity = reactContext.currentActivity ?: return
        val overlay = overlayContainer ?: return
        val decorView = activity.window.decorView as? ViewGroup

        WindowInsetsControllerCompat(activity.window, overlay).show(WindowInsetsCompat.Type.systemBars())

        overlay.animate()
            .rotation(0f)
            .setDuration(250)
            .withEndAction {
                overlay.elevation = 1f
                decorView?.clipChildren = true
                decorView?.clipToPadding = true
                syncOverlayToPlaceholder()
                // Force portrait so the device snaps back even if physically tilted,
                // then unlock after a short delay so the rest of the app rotates freely.
                activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
                mainHandler.postDelayed({
                    activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                }, 500)
            }
            .start()
    }

    private fun createCallback() = object : MediastreamPlayerCallback {

        override fun playerViewReady(msplayerView: PlayerView?) {
            sendEvent("onPlayerReady", null)
        }

        override fun onPlay() { sendEvent("onPlay", null) }
        override fun onPause() { sendEvent("onPause", null) }
        override fun onReady() {}
        override fun onEnd() { sendEvent("onEnd", null) }
        override fun onPlayerClosed() {}
        override fun onBuffering() { sendEvent("onBuffering", null) }

        override fun onError(error: String?) {
            val map = WritableNativeMap().apply { putString("error", error) }
            sendEvent("onError", map)
        }

        override fun onNext() {}
        override fun onPrevious() {}
        override fun nextEpisodeIncoming(episodeId: String) {}
        override fun nextEpisodeLoadRequested(url: String) {}

        override fun onFullscreen(enteredForPip: Boolean) {
            if (enteredForPip || mediaType.uppercase() == "VERTICAL") return
            enterFakeFullscreen()
            sendEvent("onFullscreen", null)
        }

        override fun offFullscreen() {
            if (mediaType.uppercase() == "VERTICAL") return
            exitFakeFullscreen()
            sendEvent("onExitFullscreen", null)
        }

        override fun onNewSourceAdded(config: MediastreamPlayerConfig) {}
        override fun onLocalSourceAdded() {}

        override fun onEpisodeInfoClick(id: String, order: Int) {
            val map = WritableNativeMap().apply {
                putString("id", id)
                putInt("order", order)
            }
            sendEvent("onEpisodeInfoClick", map)
        }

        override fun onAdEvents(type: AdEvent.AdEventType) {
            val map = WritableNativeMap().apply { putString("type", type.name) }
            sendEvent("onAdEvent", map)
        }

        override fun onAdErrorEvent(error: AdError) {}
        override fun onConfigChange(config: MediastreamMiniPlayerConfig?) {}
        override fun onCastAvailable(state: Boolean?) {}
        override fun onCastSessionStarting() {}
        override fun onCastSessionStarted() {}
        override fun onCastSessionStartFailed() {}
        override fun onCastSessionEnding() {}
        override fun onCastSessionEnded() {}
        override fun onCastSessionResuming() {}
        override fun onCastSessionResumed() {}
        override fun onCastSessionResumeFailed() {}
        override fun onCastSessionSuspended() {}
        override fun onPlaybackErrors(error: JSONObject?) {}
        override fun onEmbedErrors(error: JSONObject?) {}
        override fun onLiveAudioCurrentSongChanged(data: JSONObject?) {}
        override fun onDismissButton() { sendEvent("onDismissButton", null) }
        override fun onLockedEpisode(id: String) {
            val map = WritableNativeMap().apply { putString("episodeId", id) }
            sendEvent("onLockedEpisode", map)
        }
        override fun onSwipeToItem(currentId: String) {
            val map = WritableNativeMap().apply { putString("itemId", currentId) }
            sendEvent("onSwipeToItem", map)
        }
        override fun onEndReached() { sendEvent("onEndReached", null) }
        override fun onPlayerReload() {}
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        if (viewTreeObserver.isAlive) {
            viewTreeObserver.removeOnScrollChangedListener(scrollListener)
        }
        val decorView = reactContext.currentActivity?.window?.decorView as? ViewGroup
        overlayContainer?.let { decorView?.removeView(it) }
        overlayContainer = null
        if (activeInstance === this) activeInstance = null
        mainHandler.postDelayed({
            if (!isAttachedToWindow) {
                player?.releasePlayer()
                player = null
                playerInitialized = false
            }
        }, 300)
    }

    private fun buildHelloOverlay(): View {
        val dp8 = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 8f, resources.displayMetrics).toInt()
        val dp12 = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 12f, resources.displayMetrics).toInt()
        return TextView(context).apply {
            text = "Hello"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            setBackgroundColor(Color.RED)
            setPadding(dp12, dp8, dp12, dp8)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).also { lp ->
                lp.gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
                lp.topMargin = dp8
            }
        }
    }

    private fun sendEvent(eventName: String, params: com.facebook.react.bridge.WritableMap?) {
        mainHandler.post {
            try {
                reactContext.getJSModule(RCTEventEmitter::class.java)
                    .receiveEvent(id, eventName, params)
            } catch (_: Exception) {}
        }
    }

    companion object {
        private const val TAG = "MSPlayerView"
        var activeInstance: MediastreamPlayerView? = null
    }
}
