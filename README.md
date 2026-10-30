# POOPBOT MENU V2

An independent, installable Quest-friendly VR interface. It is **not a Gorilla Tag mod** and does not inject into or modify another game.

## What V2 includes

- Dark graphite/brown-black book-inspired interface with cyan/blue lighting
- Five working pages: Home, Visuals, Audio, Settings and About
- Functional page navigation and animated page transitions
- Settings toggles for particles, glow, reduced motion, sound and controller haptics
- Master-volume control and test tone
- Automatic local preference saving with reset
- Installable web-app manifest and service worker for the app shell
- Immersive WebXR book interface with controller ray selection
- Quest/browser support detection and clear failure messages

## Run in GitHub Codespaces

1. Open the repository in Codespaces.
2. Run `bash scripts/preview.sh`.
3. In the Ports tab, open port 8000 and use its HTTPS forwarded URL.
4. Open that HTTPS URL in Meta Quest Browser.
5. If the browser offers **Install app** or **Add to Home**, use it to add POOPBOT V2 to the headset's app/library experience.
6. Select **ENTER IMMERSIVE VR** and point a controller at a menu button, then pull the trigger.

For desktop/mobile preview, open the same HTTPS URL in a normal browser. WebXR requires a supported headset/browser and a secure context (HTTPS or localhost).

## Important packaging note

This repository delivers an installable **Progressive Web App (PWA)** using Quest Browser. It does not produce a native Android APK. A native Quest APK requires a separate Android/OpenXR project, Android SDK/NDK, signing configuration and testing on a physical headset. Do not label this PWA as an APK.

## Settings and offline behaviour

Preferences are saved in browser local storage on the current headset/browser profile. The service worker caches the app shell. The immersive 3D module uses a pinned Three.js dependency from jsDelivr, so first-time immersive startup and dependency updates require internet access. Browser support and installed-PWA WebXR support can vary.

## Validation

The GitHub Actions workflow checks HTML structure, JavaScript syntax, JSON manifest validity, required page/control IDs, and service-worker syntax. Automated checks do not prove headset compatibility or performance. Physical Quest testing is still required.

## Project structure

- `index.html`: responsive book-style interface
- `app.js`: page navigation, local settings, audio and PWA registration
- `vr.mjs`: immersive Three.js/WebXR book and controller interactions
- `manifest.webmanifest`: installable app metadata
- `sw.js`: offline app-shell cache
- `icons/poopbot.svg`: app icon
- `scripts/preview.sh`: Codespaces preview server
