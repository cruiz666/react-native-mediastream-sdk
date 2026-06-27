#!/usr/bin/env bash
set -e

SDK_DIR="../../../MediastreamPlatformSDKAndroid"
DEST="local-sdk/io/github/mediastream/mediastreamplatformsdkandroid/11.0.0-local"

echo "→ Building SDK AAR..."
(
  cd "$SDK_DIR"
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  export PATH="$JAVA_HOME/bin:$PATH"
  ./gradlew :mediastreamplatformsdkandroid:assembleRelease -q
)

echo "→ Copying AAR + POM to local-sdk/..."
mkdir -p "$DEST"

cp "$SDK_DIR/mediastreamplatformsdkandroid/build/outputs/aar/mediastreamplatformsdkandroid-release.aar" \
   "$DEST/mediastreamplatformsdkandroid-11.0.0-local.aar"

sed 's|<version>11.0.0-qa01</version>|<version>11.0.0-local</version>|g' \
  "$SDK_DIR/mediastreamplatformsdkandroid/build/publications/release/pom-default.xml" \
  > "$DEST/mediastreamplatformsdkandroid-11.0.0-local.pom"

echo "✓ Done. Sync Gradle in Android Studio (or run: cd app && ../gradlew dependencies)"
