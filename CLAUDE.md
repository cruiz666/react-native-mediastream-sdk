# CLAUDE.md — Contexto para Claude Code

## Qué es este proyecto

App React Native 0.73.6 (Old Architecture) que actúa como demostración del bridge nativo para el SDK de Mediastream Platform en Android e iOS. No es un SDK publicable — es una app de prueba con el bridge implementado directamente en el proyecto.

## Arquitectura del bridge

### Capa JS
- `src/native/types.ts` — tipos TypeScript: props, eventos, comandos
- `src/native/MediastreamPlayerNative.ts` — `requireNativeComponent('MediastreamPlayerView')` + comandos via `UIManager.dispatchViewManagerCommand`
- `src/components/MediastreamPlayer.tsx` — wrapper React con `forwardRef`, maneja `StatusBar` en fullscreen
- `App.tsx` — entry point, monta el player con un VOD de prueba (`id: 69e40fa9d0cf9540a9c76b56`)

### Android (Kotlin, Old Architecture)
| Archivo | Rol |
|---|---|
| `android/app/src/main/java/com/mediastreamapp/MediastreamPlayerView.kt` | UIView del bridge — init del SDK, callbacks, comandos imperativos, **transition cover para fullscreen** |
| `android/app/src/main/java/com/mediastreamapp/MediastreamPlayerViewManager.kt` | RCTViewManager — exporta props y comandos a RN |
| `android/app/src/main/java/com/mediastreamapp/MediastreamSdkPackage.kt` | Registra el ViewManager en RN |
| `android/app/src/main/java/com/mediastreamapp/MainActivity.kt` | Reenvía `onConfigurationChanged` al player activo |

### iOS (ObjC + Swift, Old Architecture)
| Archivo | Rol |
|---|---|
| `ios/MediastreamApp/MediastreamPlayerViewManager.m` | RCTViewManager en ObjC — exporta props, eventos, comandos |
| `ios/MediastreamApp/MediastreamPlayerView.swift` | UIView en Swift — instancia el SDK, suscribe eventos, lifecycle como child ViewController |
| `ios/MediastreamApp/MediastreamApp-Bridging-Header.h` | Expone headers RN a Swift |

## SDKs

### Android
- **Dependencia:** `io.github.mediastream:mediastreamplatformsdkandroid:10.0.4-alpha06`
- **Clase principal:** `MediastreamPlayer(Context, MediastreamPlayerConfig, FrameLayout, FrameLayout, FragmentManager)`
- **Callbacks:** via `MediastreamPlayerCallback` (interfaz)
- **Eventos fullscreen:** `onFullscreen(enteredForPip: Boolean)` / `offFullscreen()`
- **Repos necesarios:** `https://jitpack.io`, `https://npaw.jfrog.io/artifactory/youbora/`, `https://artifact.plugin.npaw.com/artifactory/plugins/android`

### iOS
- **Pod:** `MediastreamPlatformSDKxC ~> 3.0.1-alpha.05` (en Podfile usar `3.0.1-alpha.05` exacto)
- **Clase principal:** `MediastreamPlatformSDK: UIViewController`
- **Init:** `MediastreamPlatformSDK()` → `setup(_ config: MediastreamPlayerConfig)`
- **Embedding:** `addChild(player)` + `addSubview(player.view)` + `player.didMove(toParent:)`
- **Eventos:** `player.events.listenTo(eventName: String, action: closure)`
- **Nombres de eventos:** `"ready"`, `"play"`, `"pause"`, `"finish"`, `"buffering"`, `"error"`, `"onFullscreen"`, `"offFullscreen"`, `"onAdEvent"`
- **Seek:** `seekTo(_ time: Double)` en segundos
- **Volume:** `setVolume(volume: Int)` escala 0–100

## Decisiones de diseño importantes

### Fullscreen en Android
El bridge rota `requestedOrientation` de la Activity de RN (causa re-renders). La solución implementada es un **transition cover**: al salir de fullscreen (`offFullscreen`), se agrega un `View` negro sobre el `decorView` de la Activity antes de rotar. Se remueve cuando `onConfigurationChanged` confirma portrait (~150ms delay). Ver `showTransitionCover()` / `hideTransitionCover()` en `MediastreamPlayerView.kt`.

El re-render de RN al rotar es inevitable (es un evento de display del sistema). Lo que se resuelve es que el usuario no lo vea. Si la experiencia parece lenta, es problema de optimización de la app (falta de `React.memo`, componentes pesados), no del bridge.

### addFullscreenOverlay (Android)
La llamada `p.addFullscreenOverlay(buildHelloOverlay())` está comentada en `MediastreamPlayerView.kt`. El método `buildHelloOverlay()` existe pero inactivo — era demo del API. No descomentar sin necesidad.

### Kotlin y el SDK Android
El SDK Android está compilado con Kotlin 2.1.0. El proyecto compila con Kotlin 1.9.24. Por eso se necesita `-Xskip-metadata-version-check` en `kotlinOptions`. Sin ese flag, el compilador rechaza los metadata del SDK.

### MediastreamPlayerCallback — nullability
Los métodos del callback tienen firmas diferentes a lo que documenta el README del SDK:
- `playerViewReady(msplayerView: PlayerView?)` — nullable
- `onError(error: String?)` — nullable  
- `onConfigChange(config: MediastreamMiniPlayerConfig?)` — nullable
- `onPlaybackErrors/onEmbedErrors/onLiveAudioCurrentSongChanged(JSONObject?)` — nullable
- `nextEpisodeIncoming(episodeId: String)` — recibe String, no MediastreamPlayerConfig

## Build — Android

```
AGP: 8.6.1 (mínimo requerido por Google IMA + PrivacySandbox)
Gradle: 8.7
Kotlin: 1.9.24 con -Xskip-metadata-version-check
Java: 17
compileSdk: 35 / targetSdk: 35 / minSdk: 24
```

El APK de release usa `signingConfig signingConfigs.debug` — funciona out of the box para distribución de prueba. Para performance testing usar siempre release build (`./gradlew assembleRelease`).

## Build — iOS

Después de clonar o en máquina nueva:
```bash
cd ios && pod install
```

El `xcworkspace` generado por CocoaPods es el que se usa para compilar (no el `.xcodeproj` directamente).

## Problema conocido: LibreSSL en M4 con Bitbucket

`YouboraAVPlayerAdapter` (dep transitiva del SDK iOS) se clona desde Bitbucket. En M4 Macs, LibreSSL 3.3.6 falla con `SSL_ERROR_SYSCALL` al hacer el handshake TLS.

**Fix permanente en la máquina:**
```bash
brew install curl
# Homebrew's curl usa OpenSSL@3

codesign --remove-signature /opt/homebrew/opt/git/libexec/git-core/git-remote-https
install_name_tool -change \
  /usr/lib/libcurl.4.dylib \
  /opt/homebrew/opt/curl/lib/libcurl.4.dylib \
  /opt/homebrew/opt/git/libexec/git-core/git-remote-https
codesign --force --sign - /opt/homebrew/opt/git/libexec/git-core/git-remote-https
```

Nota: se revierte al hacer `brew upgrade git`. Si reaparece el error, repetir los pasos de codesign + install_name_tool.

La solución de fondo está en el podspec del SDK: actualizar `YouboraAVPlayerAdapter` a una versión ≥ 6.4 que use GitHub en lugar de Bitbucket.

## DummyContent

`src/components/DummyContent.tsx` simula una pantalla de detalle de streaming (títulos, episodios con thumbnails, cast, recomendados). Usa `picsum.photos` con seeds fijas para imágenes placeholder estables. Su propósito es generar suficiente contenido en scroll para validar el comportamiento del player y el re-render de fullscreen con una jerarquía de componentes real.
