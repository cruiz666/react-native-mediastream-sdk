# React Native Mediastream SDK — Demo App

App de demostración del bridge nativo para el [Mediastream Platform SDK](https://github.com/mediastream/.github) en React Native 0.73.6.

Implementa un bridge Old Architecture (ViewManager + requireNativeComponent) para Android (Kotlin) e iOS (Swift/ObjC) que expone el player de Mediastream a React Native con los mismos props, eventos y comandos en ambas plataformas.

## Requisitos

### General
- Node.js ≥ 18
- React Native CLI

### Android
- Android Studio con SDK 35
- JDK 17
- Gradle 8.7

### iOS
- Xcode 15+
- CocoaPods
- Ruby 3.x (para CocoaPods)

## Instalación

```bash
npm install
```

### iOS — instalar pods
```bash
cd ios && pod install && cd ..
```

## Correr la app

### Android
```bash
npx react-native run-android
```

### iOS
```bash
npx react-native run-ios
```

## Build de distribución (sin dev server)

### Android — APK release
```bash
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### iOS
Compilar desde Xcode con scheme `MediastreamApp` en configuración Release, o usar `xcodebuild`.

## Estructura del proyecto

```
├── App.tsx                          # Entry point — monta el player
├── src/
│   ├── native/
│   │   ├── types.ts                 # Props, eventos y comandos TypeScript
│   │   └── MediastreamPlayerNative.ts  # requireNativeComponent + comandos
│   └── components/
│       ├── MediastreamPlayer.tsx    # Wrapper React con forwardRef
│       └── DummyContent.tsx        # Contenido de scroll para testing
├── android/
│   └── app/src/main/java/com/mediastreamapp/
│       ├── MediastreamPlayerView.kt        # Bridge nativo Android
│       ├── MediastreamPlayerViewManager.kt
│       ├── MediastreamSdkPackage.kt
│       └── MainActivity.kt
└── ios/
    └── MediastreamApp/
        ├── MediastreamPlayerView.swift         # Bridge nativo iOS
        ├── MediastreamPlayerViewManager.m
        └── MediastreamApp-Bridging-Header.h
```

## Props del player

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | string | — | ID del media en Mediastream Platform |
| `type` | `"VOD"` \| `"LIVE"` \| `"EPISODE"` | `"VOD"` | Tipo de contenido |
| `accountID` | string | — | ID de cuenta Mediastream |
| `autoplay` | boolean | `true` | Reproducir automáticamente |
| `showControls` | boolean | `true` | Mostrar controles del player |
| `startAt` | number | `0` | Posición inicial en segundos |
| `volume` | number | — | Volumen inicial (0–1) |
| `dvr` | boolean | `false` | Habilitar DVR en streams en vivo |
| `adURL` | string | — | URL del ad tag IMA |

## Eventos

| Evento | Payload | Descripción |
|---|---|---|
| `onPlayerReady` | — | Player listo |
| `onPlay` | — | Inicio de reproducción |
| `onPause` | — | Pausa |
| `onEnd` | — | Fin del contenido |
| `onBuffering` | — | Buffering |
| `onError` | `{ error: string }` | Error de reproducción |
| `onFullscreen` | — | Entró a pantalla completa |
| `onExitFullscreen` | — | Salió de pantalla completa |
| `onAdEvent` | `{ type: string }` | Evento de publicidad |

## Comandos imperativos

```tsx
const playerRef = useRef<MediastreamPlayerCommands>(null);

playerRef.current?.play();
playerRef.current?.pause();
playerRef.current?.seekTo(30);    // segundos
playerRef.current?.setVolume(0.8); // 0.0 – 1.0
```

## SDKs nativos

| Plataforma | Dependencia | Versión |
|---|---|---|
| Android | `io.github.mediastream:mediastreamplatformsdkandroid` | `10.0.4-alpha06` |
| iOS | `MediastreamPlatformSDKxC` (CocoaPods) | `~> 3.0.1-alpha.05` |
