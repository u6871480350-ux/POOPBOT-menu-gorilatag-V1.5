# POOPBOT MENU V1.5

A lightweight orange-and-dark menu prototype with a **separate immersive WebXR mode** for compatible VR browsers.

## What's included

- Original-inspired two-panel layout and POOPBOT text logo
- Raised buttons that press down when touched or clicked
- Animated orange holographic rings, glow sweep, and particles
- Flat browser preview for phones and desktops
- Immersive 3D scene with controller pointer rays and trigger-to-select interaction
- Demo-only toggles, reset, and a local test tone
- Automated static HTML and JavaScript checks

## Try it privately in Codespaces

This keeps GitHub Pages unpublished while you test the menu.

1. Open this repository in your GitHub Codespace.
2. In the terminal, run: `bash scripts/preview.sh`.
3. Open the **Ports** tab and locate port **8000**.
4. Open that port in the browser and copy the forwarded **HTTPS** URL.
5. In your Quest 3, open Meta Quest Browser and visit that URL.
6. Wait for **ENTER IMMERSIVE VR** to become enabled, select it, then point a controller at a button and pull the trigger.
7. Use the headset system menu to leave VR.

Port 8000 is configured as **private** by default. If you are asked to authenticate, sign in to the same GitHub account that owns the Codespace. If immersive VR is unavailable, check that you opened the HTTPS forwarded-port URL in Quest Browser.

## Tests and publishing

The **Validate POOPBOT prototype** workflow checks the HTML structure, expected controls, inline JavaScript syntax, WebXR module syntax, and the pinned Three.js import. These automated source checks are not a replacement for physical-headset testing.

GitHub Pages publishing remains **manual**. After the Quest test is satisfactory, enable Pages with **Settings → Pages → Source: GitHub Actions**, then manually run **Publish POOPBOT site to GitHub Pages** in the Actions tab.

## Scope and safety

This project is a separate VR-browser menu demo, **not a Gorilla Tag mod and not an overlay inside Gorilla Tag**. The Long Arms, Flight, Speed, and Low Gravity controls only toggle visual demo states; they do not modify any game. It does not inject into a game or bypass a game's rules. The official Gorilla Tag Code of Conduct prohibits cheats and mods; see the [official Code of Conduct](https://www.gorillatagvr.com/contact).

The immersive mode loads its pinned Three.js module from jsDelivr, so the Quest Browser needs internet access.
