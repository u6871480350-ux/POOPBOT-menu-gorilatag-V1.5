import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const launch = document.getElementById('enter-vr');
const supportNote = document.getElementById('vr-support-note');
const pageStatus = document.getElementById('status');
let supported = false;
let session = null;
let renderer = null;
let scene = null;
let camera = null;
let root = null;
let statusPlane = null;
let hitTargets = [];
let controls = [];
let rings = [];
let localSound = false;
let audioContext = null;

function setPageStatus(text) {
  if (pageStatus) pageStatus.textContent = text;
}
function setStatus(text) {
  setPageStatus(text);
  if (!statusPlane) return;
  const old = statusPlane.material.map;
  statusPlane.material.map = textTexture(text, 'status');
  statusPlane.material.needsUpdate = true;
  if (old) old.dispose();
}
function textureFromCanvas(canvas) {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.anisotropy = 4;
  return map;
}
function textTexture(text, type, active = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = type === 'logo' ? 220 : 128;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (type === 'button') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (active) {
      g.addColorStop(0, '#bafff1'); g.addColorStop(.5, '#67e6ca'); g.addColorStop(1, '#138c78');
    } else {
      g.addColorStop(0, '#ffe0b0'); g.addColorStop(.4, '#ffb454'); g.addColorStop(1, '#d5681a');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(5, 5, w - 10, h - 10, 20);
    ctx.fill();
    ctx.strokeStyle = active ? '#edfff9' : '#fff0d4';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = active ? '#07392f' : '#3b1704';
    ctx.font = '900 46px system-ui, Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 2, w - 42);
  } else if (type === 'logo') {
    ctx.font = '1000 145px system-ui, Arial Black, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = '#78340d';
    ctx.strokeText(text, w / 2, h / 2 + 7, w - 25);
    ctx.fillStyle = '#ffd096'; ctx.shadowColor = '#ff8424'; ctx.shadowBlur = 26;
    ctx.fillText(text, w / 2, h / 2, w - 25);
  } else {
    ctx.font = type === 'heading' ? '900 43px system-ui, Arial, sans-serif' : '800 38px system-ui, Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = type === 'heading' ? '#ffd096' : '#79ffdf';
    ctx.shadowColor = type === 'heading' ? '#ff8c24' : '#79ffdf'; ctx.shadowBlur = 12;
    ctx.fillText(text, w / 2, h / 2, w - 20);
  }
  return textureFromCanvas(canvas);
}
function addPlane(parent, text, width, height, x, y, z, type) {
  const material = new THREE.MeshBasicMaterial({ map: textTexture(text, type), transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(x, y, z);
  mesh.renderOrder = 3;
  parent.add(mesh);
  return mesh;
}
function addBox(parent, width, height, depth, x, y, z, color, edgeColor) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, metalness: .42, roughness: .34, emissive: color, emissiveIntensity: .13
  }));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: edgeColor }));
  edges.position.copy(mesh.position);
  parent.add(edges);
  return mesh;
}
function addButton(label, kind, x, y) {
  const group = new THREE.Group();
  group.position.set(x, y, .115);
  const body = new THREE.Mesh(new THREE.BoxGeometry(.56, .088, .055), new THREE.MeshStandardMaterial({
    color: 0xc66a22, metalness: .55, roughness: .28, emissive: 0x2b1005
  }));
  group.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.542, .074), new THREE.MeshBasicMaterial({
    map: textTexture(label + (kind === 'toggle' || kind === 'sound' ? ': OFF' : ''), 'button'), side: THREE.DoubleSide
  }));
  face.position.z = .029;
  face.userData.buttonRoot = group;
  group.add(face);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(.52, .003, .002), new THREE.MeshBasicMaterial({ color: 0xffe1b4 }));
  trim.position.set(0, .031, .032);
  group.add(trim);
  group.userData = { label, kind, on: false, baseZ: .115, pressed: false, hovered: false, body, face };
  root.add(group);
  controls.push(group);
  hitTargets.push(face);
}
function makeScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x09060f);
  camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, .05, 40);
  scene.add(new THREE.HemisphereLight(0xffe4c7, 0x1c0d23, 2));
  const warm = new THREE.PointLight(0xff8c24, 13, 5); warm.position.set(.1, .4, -1.1); scene.add(warm);
  const cool = new THREE.PointLight(0x51ffdf, 7, 4); cool.position.set(-.8, -.3, -1.6); scene.add(cool);

  root = new THREE.Group();
  root.position.set(0, 0, -1.8);
  scene.add(root);
  addBox(root, 1.48, 1.18, .07, 0, 0, 0, 0x231226, 0xff922e);
  addBox(root, 1.43, 1.13, .012, 0, 0, .039, 0x160d1a, 0x8f4a22);
  addPlane(root, 'POOPBOT', .98, .16, 0, .49, .055, 'logo');
  addPlane(root, 'VR CONTROL DECK  //  V1.5', .78, .05, 0, .385, .06, 'status');

  const ringDefs = [
    [new THREE.TorusGeometry(.49, .0045, 6, 96), 0xff8c24, .49, .29, .045, .82],
    [new THREE.TorusGeometry(.55, .003, 6, 96), 0x79ffdf, .49, .34, .04, .44],
    [new THREE.TorusGeometry(.42, .0025, 6, 96), 0xffc478, .49, .22, .035, .42]
  ];
  rings = ringDefs.map(([geo, color, y, sy, z, opacity]) => {
    const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity }));
    ring.position.set(0, y, z); ring.scale.y = sy; root.add(ring); return ring;
  });

  const panels = [
    { x: -.365, title: 'MOVEMENT / 01', items: [
      ['LONG ARMS', 'toggle', .135], ['FLIGHT', 'toggle', -.01], ['SPEED', 'toggle', -.155], ['LOW GRAVITY', 'toggle', -.30]
    ]},
    { x: .365, title: 'SYSTEM / 02', items: [
      ['LOCAL SOUND', 'sound', .135], ['PLAY TEST TONE', 'beep', -.01], ['RESET DEMO', 'reset', -.155], ['CLOSE MENU', 'close', -.30]
    ]}
  ];
  for (const panel of panels) {
    addBox(root, .665, .785, .035, panel.x, -.04, .06, 0x2c172b, 0xff9840);
    addPlane(root, panel.title, .60, .055, panel.x, .272, .084, 'heading');
    panel.items.forEach(item => addButton(item[0], item[1], panel.x, item[2]));
  }
  statusPlane = addPlane(root, 'TRIGGER = SELECT  •  UI PREVIEW', 1.13, .052, 0, -.535, .07, 'status');

  const particlePositions = [];
  for (let i = 0; i < 70; i++) particlePositions.push((Math.random() - .5) * 4.8, (Math.random() - .5) * 3.2, -2 - Math.random() * 4);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xffa24b, size: .012, transparent: true, opacity: .7 })));
}
function refreshButton(button) {
  const d = button.userData;
  const label = d.kind === 'toggle' || d.kind === 'sound' ? d.label + ': ' + (d.on ? 'ON' : 'OFF') : d.label;
  const old = d.face.material.map;
  d.face.material.map = textTexture(label, 'button', d.on);
  d.face.material.needsUpdate = true;
  if (old) old.dispose();
  d.body.material.color.set(d.on ? 0x168c79 : 0xc66a22);
  d.body.material.emissive.set(d.on ? 0x06372e : 0x2b1005);
}
function playTone() {
  if (!localSound) { setStatus('TURN LOCAL SOUND ON FIRST'); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { setStatus('AUDIO NOT SUPPORTED'); return; }
    if (!audioContext) audioContext = new AC();
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(620, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + .12);
    gain.gain.setValueAtTime(.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.1, audioContext.currentTime + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .22);
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.start(); osc.stop(audioContext.currentTime + .23);
    setStatus('TEST TONE PLAYED');
  } catch { setStatus('AUDIO UNAVAILABLE'); }
}
function activate(button) {
  const d = button.userData;
  d.pressed = true;
  setTimeout(() => { d.pressed = false; }, 150);
  if (d.kind === 'toggle') {
    d.on = !d.on; refreshButton(button);
    setStatus(d.label + ' PREVIEW ' + (d.on ? 'ON' : 'OFF'));
  } else if (d.kind === 'sound') {
    localSound = !localSound; d.on = localSound; refreshButton(button);
    setStatus('LOCAL SOUND ' + (localSound ? 'ON' : 'OFF'));
  } else if (d.kind === 'beep') playTone();
  else if (d.kind === 'reset') {
    controls.forEach(entry => {
      if (entry.userData.kind === 'toggle' || entry.userData.kind === 'sound') {
        entry.userData.on = false; refreshButton(entry);
      }
      entry.userData.pressed = false;
    });
    localSound = false; setStatus('DEMO RESET');
  } else if (d.kind === 'close' && session) session.end();
}
function hitFrom(controller) {
  const rc = controller.userData.raycaster;
  rc.setFromXRController(controller);
  const hits = rc.intersectObjects(hitTargets, false);
  return hits.length ? hits[0].object.userData.buttonRoot : null;
}
function setupControllers() {
  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    const geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -2.2)]);
    controller.add(new THREE.Line(geom, new THREE.LineBasicMaterial({ color: 0x79ffdf, transparent: true, opacity: .9 })));
    controller.userData.raycaster = new THREE.Raycaster();
    controller.addEventListener('selectstart', () => {
      const button = hitFrom(controller);
      if (button) activate(button);
    });
    scene.add(controller);
  }
}
function animate(time) {
  controls.forEach(button => { button.userData.hovered = false; });
  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    const target = hitFrom(controller);
    if (target) target.userData.hovered = true;
  }
  for (const button of controls) {
    const d = button.userData;
    const z = d.baseZ + (d.pressed ? -.025 : d.hovered ? .008 : 0);
    button.position.z += (z - button.position.z) * .38;
  }
  if (rings[0]) rings[0].rotation.z = time * .23;
  if (rings[1]) rings[1].rotation.z = -time * .17;
  if (rings[2]) rings[2].rotation.z = time * .31;
  if (root) root.position.y = Math.sin(time * .8) * .008;
}
function cleanup() {
  if (renderer) {
    renderer.setAnimationLoop(null);
    renderer.domElement.remove();
    renderer.dispose();
  }
  if (scene) scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(mat => { if (mat.map) mat.map.dispose(); mat.dispose(); });
    }
  });
  session = null; renderer = null; scene = null; camera = null; root = null;
  statusPlane = null; hitTargets = []; controls = []; rings = [];
  launch.disabled = false; launch.textContent = supported ? 'ENTER IMMERSIVE VR' : 'IMMERSIVE VR NOT SUPPORTED HERE';
  supportNote.textContent = 'VR session ended. The buttons only affect this demo, not Gorilla Tag.';
  setPageStatus('VR SESSION ENDED • UI PREVIEW');
}
async function startVR() {
  launch.disabled = true; launch.textContent = 'STARTING VR...';
  try {
    session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    renderer.domElement.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:50;display:block;background:#09060f';
    renderer.domElement.setAttribute('aria-label', 'POOPBOT immersive VR menu');
    document.body.appendChild(renderer.domElement);
    makeScene(); setupControllers();
    await renderer.xr.setSession(session);
    session.addEventListener('end', cleanup, { once: true });
    launch.textContent = 'VR SESSION ACTIVE';
    supportNote.textContent = 'Point a controller at a button and pull the trigger. Use the headset system menu to exit.';
    setStatus('VR READY • POINT AND SELECT');
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => { animate(clock.getElapsedTime()); renderer.render(scene, camera); });
  } catch (error) {
    console.error('POOPBOT WebXR start error:', error);
    try { if (session) await session.end(); } catch {}
    cleanup();
    launch.disabled = false; launch.textContent = 'TRY ENTERING VR AGAIN';
    supportNote.textContent = 'Could not start VR. Open this page in Quest Browser over HTTPS and allow immersive VR.';
    setPageStatus('VR COULD NOT START • CHECK QUEST BROWSER');
  }
}
async function detectSupport() {
  if (!isSecureContext || !navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') {
    launch.disabled = true; launch.textContent = 'VR MODE NEEDS QUEST BROWSER';
    supportNote.textContent = 'Open the published HTTPS page in Meta Quest Browser. Immersive VR needs a compatible headset browser.';
    return;
  }
  try { supported = await navigator.xr.isSessionSupported('immersive-vr'); }
  catch { supported = false; }
  launch.disabled = !supported;
  launch.textContent = supported ? 'ENTER IMMERSIVE VR' : 'IMMERSIVE VR NOT SUPPORTED HERE';
  supportNote.textContent = supported
    ? 'Immersive VR is supported here. Launch to try the 3D menu with controller rays.'
    : 'Open this HTTPS page in Meta Quest Browser on the Quest 3 to check immersive VR support.';
}
launch.addEventListener('click', () => { if (supported && !session) startVR(); });
detectSupport();
