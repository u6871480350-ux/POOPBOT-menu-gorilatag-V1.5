# POOPBOT MENU V1.5

A lightweight orange-and-dark menu prototype with a **separate immersive WebXR mode** for compatible VR browsers.

## What's included

- Original-inspired two-panel layout and POOPBOT text logo
- Raised buttons that press down when touched or clicked
- Animated orange holographic rings, glow sweep, and particles
- Flat browser preview for phones and desktops
- Immersive 3D scene with controller pointer rays and trigger-to-select interaction, using a pinned Three.js module
- Demo-only toggles, reset, and a local test tone
- Automated static HTML and JavaScript checks

## Try the VR mode

1. Open the site over HTTPS in the Meta Quest Browser on the Quest 3.
2. Wait for **ENTER IMMERSIVE VR** to become enabled.
3. Select it, allow the browser to start immersive VR, then point either controller at the raised buttons and pull the trigger.
4. Use the headset system menu to leave VR.

On a phone or a browser without immersive WebXR support, the VR button stays disabled and the normal 2D preview remains available.

## Tests and publishing

The **Validate POOPBOT prototype** workflow checks the HTML structure, expected controls, inline JavaScript syntax, WebXR module syntax, and the pinned Three.js import. These are automated source checks, not a replacement for testing in a physical headset.

Website publishing remains **manual** until the owner tries the VR preview. To publish later, enable GitHub Pages with **Settings → Pages → Source: GitHub Actions**, then manually run **Publish POOPBOT site to GitHub Pages** in the Actions tab.

## Scope and safety

This project is a separate VR-browser menu demo, **not a Gorilla Tag mod and not an overlay inside Gorilla Tag**. The Long Arms, Flight, Speed, and Low Gravity controls only toggle visual demo states; they do not modify any game. It does not inject into a game or bypass a game's rules. The official Gorilla Tag conduct rules prohibit cheats and mods; see the [official Code of Conduct](https://www.gorillatagvr.com/contact).

The immersive mode loads its pinned Three.js module from jsDelivr, so the Quest Browser needs internet access.
