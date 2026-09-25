# Android Gemma bridge

This is the intended final phone architecture: the v8 Reader web UI runs inside a WebView, while Gemma 4 E2B runs locally through LiteRT-LM. The web page calls `window.GemmaBridge.generate(prompt)` and the native bridge returns through `window.GemmaBridgeResponse(text)`.

## Setup
1. Open this folder in Android Studio.
2. Put `gemma-4-E2B-it.litertlm` into the app's internal files directory as that exact filename. (For a first prototype, use Android Studio's Device File Explorer or add a small file-picker flow.)
3. Change the laptop LAN IP in `MainActivity.kt` from `192.168.0.1` to your Mac's Wi-Fi IP.
4. Build/install on the Android phone.
5. Run the Node server on the Mac and open the laptop page.

The LiteRT-LM Kotlin API provides `Engine`, `EngineConfig`, `Conversation`, and `sendMessage`; Gemma 4 E2B is currently listed by Google AI Edge as an Android LiteRT-LM model with text/image/audio support and an 8 GB minimum-device-memory listing. The model is ~2.6 GB, so do not bundle it into this ZIP.
