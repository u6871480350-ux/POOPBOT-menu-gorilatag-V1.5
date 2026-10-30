# POOPBOT V2 — standalone Meta Quest demo

This folder contains the source for a **separate standalone Quest app** with a floating 3D troll-book menu. It is visual-only: it does not load into, inject into, or change Gorilla Tag.

## Controls

- **A button (right controller):** open / close the book.
- **Point the right controller at a button + hold Trigger:** press the fake button.
- Buttons play a sound and give a small controller haptic pulse. They do not perform game actions.

## Build an APK

You need a computer with Unity Hub. This repository does not contain a compiled APK yet.

1. Install **Unity 2022.3 LTS** with **Android Build Support**, including Android SDK & NDK Tools and OpenJDK.
2. Create a new **3D Core** Unity project.
3. Open the project in Unity. The XR Management and OpenXR packages are listed in `Packages/manifest.json`; let Unity finish resolving packages.
4. In Project Settings:
   - Switch the build platform to **Android**.
   - Under XR Plug-in Management > Android, enable **OpenXR**.
   - In OpenXR settings, enable the **Meta Quest Support** feature group (install the Meta OpenXR feature package if Unity asks).
   - Set Active Input Handling to **Both** or **Input Manager (Old)**.
   - Set the Android minimum API level to 29 or higher.
5. Copy `Assets/Scripts/PoopbotQuestMenu.cs` from this folder into the same path in your Unity project.
6. Create a scene named `Main`. Add an **XR Origin (VR)** from the XR Interaction Toolkit / XR menu (install XR Interaction Toolkit and import its Starter Assets if Unity prompts you). Make sure the XR Origin contains the tracked camera and right-hand controller. Add `Main` to Build Settings.
7. Build Settings > Android > Build. Unity creates the APK. For Quest, use a trusted USB connection and an approved sideloading workflow to install your own app.

## Important limitations

- This is a standalone app. It cannot draw objects over Gorilla Tag or make a menu appear inside that game.
- A controller's A / Trigger input depends on Quest OpenXR controller tracking being configured correctly.
- The project source has not been built or tested on a physical Quest in this repository. Do not treat it as a verified APK until you build and test it.
- The fake buttons only play local sounds / haptics and write a debug message.
