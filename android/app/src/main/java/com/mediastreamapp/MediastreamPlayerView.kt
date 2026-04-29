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
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView
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
    private var transitionCover: View? = null

    // Props set by the ViewManager before attach
    var accountID: String? = null
    var mediaId: String? = null
    var mediaType: String = "VOD"
    var autoplay: Boolean = true
    var startAt: Int = -1
    var volume: Float = -1f
    var showControls: Boolean = true
    var dvr: Boolean = false
    var adURL: String? = null

    // The SDK adds/re-adds its player views as children during orientation changes;
    // those views may still have a parent, so we detach them first.
    override fun addView(child: View, index: Int, params: ViewGroup.LayoutParams) {
        (child.parent as? ViewGroup)?.removeView(child)
        super.addView(child, index, params)
    }

    // React Native bypasses Android's layout system; force re-measure when the SDK
    // adds child views (ExoPlayer surface) so they get proper dimensions.
    private val measureAndLayout = Runnable {
        measure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
        )
        layout(left, top, right, bottom)
    }

    override fun requestLayout() {
        super.requestLayout()
        post(measureAndLayout)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        activeInstance = this
        initPlayer()
    }

    fun initPlayer() {
        if (playerInitialized) return
        val id = mediaId ?: run { Log.d(TAG, "initPlayer: mediaId not set yet"); return }
        val activity = reactContext.currentActivity as? FragmentActivity
            ?: run { Log.e(TAG, "initPlayer: currentActivity is null or not FragmentActivity"); return }

        Log.d(TAG, "initPlayer: starting id=$id size=${width}x${height}")
        playerInitialized = true

        val config = MediastreamPlayerConfig().apply {
            accountID?.let { this.accountID = it }
            this.id = id
            type = when (mediaType.uppercase()) {
                "LIVE"    -> MediastreamPlayerConfig.VideoTypes.LIVE
                "EPISODE" -> MediastreamPlayerConfig.VideoTypes.EPISODE
                else      -> MediastreamPlayerConfig.VideoTypes.VOD
            }
            autoplay = this@MediastreamPlayerView.autoplay
            if (this@MediastreamPlayerView.startAt >= 0) startAt = this@MediastreamPlayerView.startAt
            if (this@MediastreamPlayerView.volume >= 0f) volume = this@MediastreamPlayerView.volume * 100f
            showControls = this@MediastreamPlayerView.showControls
            dvr = this@MediastreamPlayerView.dvr
            adURL = this@MediastreamPlayerView.adURL
            appHandlesWindowInsets = true
        }

        Log.d(TAG, "initPlayer: creating MediastreamPlayer")
        player = MediastreamPlayer(
            context,
            config,
            this,
            this,
            activity.supportFragmentManager
        ).also { p ->
            p.addPlayerCallback(createCallback())
            // p.addFullscreenOverlay(buildHelloOverlay())
        }
    }

    // Called by MainActivity.onConfigurationChanged — mirrors the native sample pattern.
    fun handleConfigChange(newConfig: Configuration) {
        if (player?.isOnFullscreen == true && newConfig.orientation == Configuration.ORIENTATION_PORTRAIT) {
            player?.exitFullscreen()
        }
        reapplyLayout()
        // Display is now portrait and RN is re-rendering — remove cover after one
        // layout pass so the user never sees the intermediate state.
        if (newConfig.orientation == Configuration.ORIENTATION_PORTRAIT) {
            postDelayed({ hideTransitionCover() }, 150)
        }
    }

    // After fullscreen exit the SDK restores the player view to our container but its
    // LayoutParams may be stale. Bring the view to front and ensure MATCH_PARENT fill.
    private fun reapplyLayout() {
        requestLayout()
        post {
            if (childCount > 0) {
                val playerView = getChildAt(childCount - 1)
                playerView.bringToFront()
                (playerView.layoutParams as? FrameLayout.LayoutParams)?.let { lp ->
                    lp.gravity = Gravity.TOP or Gravity.START
                    lp.width = LayoutParams.MATCH_PARENT
                    lp.height = LayoutParams.MATCH_PARENT
                    playerView.layoutParams = lp
                }
            }
        }
    }

    // Imperative commands from JS
    fun play() { player?.play() }
    fun pause() { player?.pause() }
    fun seekTo(seconds: Double) { player?.seekTo((seconds * 1000).toLong()) }
    fun setVolumeLevel(vol: Double) { player?.setSessionVolume(vol.toFloat()) }

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
            if (enteredForPip) return
            reactContext.currentActivity?.requestedOrientation =
                ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            sendEvent("onFullscreen", null)
        }

        override fun offFullscreen() {
            showTransitionCover()
            reactContext.currentActivity?.requestedOrientation =
                ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            reapplyLayout()
            sendEvent("onExitFullscreen", null)
        }

        override fun onNewSourceAdded(config: MediastreamPlayerConfig) {}
        override fun onLocalSourceAdded() {}

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
        override fun onDismissButton() {}
        override fun onPlayerReload() {}
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        hideTransitionCover()
        if (activeInstance === this) activeInstance = null
        mainHandler.postDelayed({
            if (!isAttachedToWindow) {
                player?.releasePlayer()
                player = null
                playerInitialized = false
            }
        }, 300)
    }

    private fun showTransitionCover() {
        if (transitionCover != null) return
        val decorView = reactContext.currentActivity?.window?.decorView as? ViewGroup ?: return
        transitionCover = View(context).apply {
            setBackgroundColor(Color.BLACK)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }
        decorView.addView(transitionCover)
    }

    private fun hideTransitionCover() {
        val decorView = reactContext.currentActivity?.window?.decorView as? ViewGroup ?: return
        transitionCover?.let { decorView.removeView(it) }
        transitionCover = null
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
