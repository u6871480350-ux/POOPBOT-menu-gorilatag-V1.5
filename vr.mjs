import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const launch=document.getElementById('enter-vr');
const statusEl=document.getElementById('status');
const KEY='poopbot-v2-settings';
const DEFAULTS={particles:true,glow:true,reducedMotion:false,sound:true,haptics:true,volume:35};
let settings=loadSettings(),session=null,renderer=null,scene=null,camera=null,book=null,statusMesh=null;
let hitTargets=[],buttons=[],navButtons=[],activePage='home',lastFrame=0,particlePoints=null;
const pages=['home','visuals','audio','settings','about'];
function loadSettings(){try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...DEFAULTS}}}
function saveSettings(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}}
function announce(message){if(statusEl)statusEl.textContent=message;}
function canvasTexture(text,kind='button',active=false){
 const c=document.createElement('canvas');c.width=1024;c.height=kind==='logo'?220:128;
 const x=c.getContext('2d'),w=c.width,h=c.height;x.clearRect(0,0,w,h);
 if(kind==='button'){
  const g=x.createLinearGradient(0,0,0,h);
  if(active){g.addColorStop(0,'#cafff4');g.addColorStop(.48,'#66e7ca');g.addColorStop(1,'#128c79')}
  else{g.addColorStop(0,'#d4f7ff');g.addColorStop(.48,'#55cfff');g.addColorStop(1,'#087ca9')}
  x.fillStyle=g;x.beginPath();x.roundRect(5,5,w-10,h-10,22);x.fill();
  x.strokeStyle=active?'#eafff9':'#e3faff';x.lineWidth=4;x.stroke();
  x.fillStyle=active?'#052d26':'#042333';x.font='900 46px system-ui,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2+2,w-42);
 }else{
  x.textAlign='center';x.textBaseline='middle';x.font=kind==='logo'?'1000 145px system-ui,Arial Black':'900 48px system-ui,Arial';
  x.fillStyle=kind==='logo'?'#e8f9ff':kind==='heading'?'#c5f2ff':'#8cecff';
  x.shadowColor='#42cfff';x.shadowBlur=kind==='logo'?30:12;x.fillText(text,w/2,h/2,w-20);
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=4;return t;
}
function addPlane(parent,text,w,h,x,y,z,kind='heading'){
 const mat=new THREE.MeshBasicMaterial({map:canvasTexture(text,kind),transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);mesh.position.set(x,y,z);mesh.renderOrder=4;parent.add(mesh);return mesh;
}
function addPanel(parent,w,h,x,y,z){
 const geo=new THREE.BoxGeometry(w,h,.035),mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x142438,metalness:.38,roughness:.35,emissive:0x071a2b,emissiveIntensity:.4}));
 mesh.position.set(x,y,z);parent.add(mesh);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x4abfe8}));edge.position.copy(mesh.position);parent.add(edge);return mesh;
}
function makeButton(label,id,x,y,w=.67){
 const group=new THREE.Group();group.position.set(x,y,.105);
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,.105,.065),new THREE.MeshStandardMaterial({color:0x117da6,metalness:.42,roughness:.3,emissive:0x07324a,emissiveIntensity:.45}));
 group.add(body);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(w-.018,.087),new THREE.MeshBasicMaterial({map:canvasTexture(label,'button'),side:THREE.DoubleSide}));
 face.position.z=.034;face.userData.buttonRoot=group;group.add(face);
 group.userData={id,label,on:false,baseZ:.105,pressed:false,hovered:false,body,face};
 book.add(group);buttons.push(group);hitTargets.push(face);return group;
}
function makeNav(label,page,x){
 const b=makeButton(label,'page:'+page,x,.365,.275);navButtons.push(b);return b;
}
function disposeMap(material){if(material?.map)material.map.dispose();}
function updateButton(b,label,on=false){
 const d=b.userData;d.label=label;d.on=on;const old=d.face.material.map;d.face.material.map=canvasTexture(label,'button',on);d.face.material.needsUpdate=true;if(old)old.dispose();
 d.body.material.color.set(on?0x168f7a:0x117da6);d.body.material.emissive.set(on?0x064034:0x07324a);
}
function currentSettingLabel(key){const names={particles:'PARTICLES',glow:'BLUE GLOW',reducedMotion:'REDUCED MOTION',sound:'INTERFACE SOUND',haptics:'HAPTICS'};return names[key]||key.toUpperCase()}
function buildPage(page){
 activePage=page;
 buttons.forEach(b=>{book.remove(b);b.userData.face.material.map?.dispose();b.userData.face.material.dispose();b.userData.body.geometry.dispose();b.userData.body.material.dispose();});
 buttons=[];hitTargets=navButtons.map(b=>b.userData.face);
 const left=-.39,right=.39;
 if(page==='home'){
  makeButton('WELCOME TO POOPBOT V2','info',0,.12,.92);
  makeButton('VISUAL SETTINGS','page:visuals',left,-.10,.70);
  makeButton('OPEN SETTINGS','page:settings',right,-.10,.70);
  makeButton('AUDIO SETTINGS','page:audio',left,-.29,.70);
  makeButton('ABOUT THIS APP','page:about',right,-.29,.70);
 }else if(page==='visuals'){
  for(const [i,key] of ['particles','glow','reducedMotion'].entries())makeButton(currentSettingLabel(key)+': '+(settings[key]?'ON':'OFF'),'setting:'+key,0,.13-i*.19,.92,settings[key]);
  makeButton('BACK TO HOME','page:home',0,-.43,.92);
 }else if(page==='audio'){
  makeButton('INTERFACE SOUND: '+(settings.sound?'ON':'OFF'),'setting:sound',0,.17,.92,settings.sound);
  makeButton('VOLUME DOWN','volume:-',left,-.04,.70);
  makeButton('VOLUME '+settings.volume+'%','volume:show',right,-.04,.70);
  makeButton('VOLUME UP','volume:+',left,-.23,.70);
  makeButton('PLAY TEST TONE','tone',right,-.23,.70);
  makeButton('BACK TO HOME','page:home',0,-.43,.92);
 }else if(page==='settings'){
  makeButton('CONTROLLER HAPTICS: '+(settings.haptics?'ON':'OFF'),'setting:haptics',0,.14,.92,settings.haptics);
  makeButton('RESET ALL SETTINGS','reset',0,-.08,.92);
  makeButton('BACK TO HOME','page:home',0,-.31,.92);
 }else{
  makeButton('INDEPENDENT QUEST VR APP','info',0,.13,.98);
  makeButton('NOT CONNECTED TO GORILLA TAG','info',0,-.04,.98);
  makeButton('NO GAME INJECTION OR CHEATS','info',0,-.21,.98);
  makeButton('BACK TO HOME','page:home',0,-.42,.92);
 }
 refreshNav();
}
function refreshNav(){
 navButtons.forEach(b=>{const page=b.userData.id.slice(5);const active=page===activePage;updateButton(b,b.userData.label,active);});
}
function addHaptics(){
 if(!settings.haptics||!session)return;
 try{for(const source of session.inputSources){const actuator=source.gamepad?.hapticActuators?.[0];if(actuator?.pulse)actuator.pulse(.25,.035).catch(()=>{});}}catch{}
}
let audioContext=null;
function playTone(){
 if(!settings.sound){setStatus('TURN INTERFACE SOUND ON FIRST');return;}
 try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('No audio');
  if(!audioContext)audioContext=new AC();if(audioContext.state==='suspended')audioContext.resume();
  const osc=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
  osc.type='sine';osc.frequency.setValueAtTime(620,now);osc.frequency.exponentialRampToValueAtTime(880,now+.13);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.12*(settings.volume/100),now+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+.23);
  osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(now+.24);setStatus('TEST TONE PLAYED');
 }catch{setStatus('AUDIO UNAVAILABLE');}
}
function setStatus(message){announce(message);if(!statusMesh)return;const old=statusMesh.material.map;statusMesh.material.map=canvasTexture(message,'status');statusMesh.material.needsUpdate=true;if(old)old.dispose();}
function activate(b){
 const id=b.userData.id; b.userData.pressed=true;addHaptics();
 if(id.startsWith('page:')){const page=id.slice(5);buildPage(page);setStatus(page.toUpperCase()+' PAGE');return;}
 if(id.startsWith('setting:')){
  const key=id.slice(8);settings[key]=!settings[key];saveSettings();buildPage(activePage);setStatus(currentSettingLabel(key)+' '+(settings[key]?'ON':'OFF'));return;
 }
 if(id==='volume:-'||id==='volume:+'){settings.volume=Math.max(0,Math.min(100,settings.volume+(id.endsWith('-')?-5:5)));saveSettings();buildPage('audio');setStatus('VOLUME '+settings.volume+'%');return;}
 if(id==='tone'){playTone();return;}
 if(id==='reset'){settings={...DEFAULTS};saveSettings();buildPage('settings');setStatus('SETTINGS RESET');return;}
 if(id==='info')setStatus('POOPBOT V2 • STANDALONE VR');
}
function makeScene(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x070d16);
 camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.05,30);
 scene.add(new THREE.HemisphereLight(0xd5f4ff,0x101521,2));
 const blue=new THREE.PointLight(0x35caff,10,4);blue.position.set(-.8,.5,-1.2);scene.add(blue);
 const cool=new THREE.PointLight(0x8cecff,5,3);cool.position.set(.9,-.4,-1.5);scene.add(cool);
 book=new THREE.Group();book.position.set(0,0,-1.55);scene.add(book);
 addPanel(book,1.55,1.17,0,0,0);
 addPanel(book,.73,1.08,-.395,0,.028);
 addPanel(book,.73,1.08,.395,0,.028);
 const spine=new THREE.Mesh(new THREE.BoxGeometry(.035,1.1,.06),new THREE.MeshStandardMaterial({color:0x3b647d,metalness:.6,roughness:.3,emissive:0x12334b}));spine.position.set(0,0,.06);book.add(spine);
 addPlane(book,'POOPBOT',.85,.17,0,.49,.06,'logo');
 addPlane(book,'V2 // QUEST CONTROL DECK',.86,.055,0,.405,.065,'status');
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.52,.003,6,96),new THREE.MeshBasicMaterial({color:0x42cfff,transparent:true,opacity:.48}));ring.position.set(0,.49,.045);ring.scale.y=.36;book.add(ring);
 const nav=[['HOME','home',-.57],['VISUALS','visuals',-.285],['AUDIO','audio',0],['SETTINGS','settings',.285],['ABOUT','about',.57]];
 nav.forEach(([label,page,x])=>makeNav(label,page,x));
 statusMesh=addPlane(book,'TRIGGER TO SELECT • V2.0',1.12,.05,0,-.535,.08,'status');
 buildPage('home');
 const positions=[];for(let i=0;i<90;i++)positions.push((Math.random()-.5)*4,(Math.random()-.5)*3,-1-Math.random()*4);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 particlePoints=new THREE.Points(geo,new THREE.PointsMaterial({color:0x52d7ff,size:.009,transparent:true,opacity:.55}));scene.add(particlePoints);
}
function hit(controller){const rc=controller.userData.raycaster;rc.setFromXRController(controller);const hits=rc.intersectObjects(hitTargets,false);return hits.length?hits[0].object.userData.buttonRoot:null;}
function setupControllers(){
 for(let i=0;i<2;i++){
  const c=renderer.xr.getController(i),geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-2.2)]);
  c.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x8cecff,transparent:true,opacity:.9})));
  c.userData.raycaster=new THREE.Raycaster();c.addEventListener('selectstart',()=>{const b=hit(c);if(b)activate(b);});scene.add(c);
 }
}
function animate(t){
 for(const b of buttons)b.userData.hovered=false;
 for(let i=0;i<2;i++){const c=renderer.xr.getController(i),b=hit(c);if(b)b.userData.hovered=true;}
 for(const b of buttons.concat(navButtons)){const d=b.userData;const target=d.baseZ+(d.pressed?-.035:d.hovered?.012:0);b.position.z+=(target-b.position.z)*.35;if(d.pressed&&t-lastFrame>.2)d.pressed=false;}
 if(book&&!settings.reducedMotion)book.position.y=Math.sin(t*.75)*.006;
 if(particlePoints)particlePoints.visible=settings.particles;
 if(particlePoints?.material)particlePoints.material.opacity=settings.glow?.55:.18;
 lastFrame=t;
}
function cleanup(){
 if(renderer){renderer.setAnimationLoop(null);renderer.domElement.remove();renderer.dispose();}
 if(scene)scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){disposeMap(m);m.dispose();}}});
 session=null;renderer=null;scene=null;camera=null;book=null;statusMesh=null;hitTargets=[];buttons=[];navButtons=[];particlePoints=null;
 launch.disabled=false;launch.textContent='ENTER IMMERSIVE VR';announce('VR SESSION ENDED • V2.0');
}
async function startVR(){
 launch.disabled=true;launch.textContent='STARTING IMMERSIVE VR…';
 try{
  session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor']});
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');
  renderer.domElement.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:100;display:block;background:#070d16';
  document.body.appendChild(renderer.domElement);makeScene();setupControllers();await renderer.xr.setSession(session);
  session.addEventListener('end',cleanup,{once:true});launch.textContent='VR SESSION ACTIVE';
  const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{animate(clock.getElapsedTime());renderer.render(scene,camera);});
 }catch(error){console.error('POOPBOT WebXR startup failed:',error);try{if(session)await session.end()}catch{}cleanup();launch.disabled=false;launch.textContent='RETRY IMMERSIVE VR';announce('VR START FAILED • OPEN IN QUEST BROWSER OVER HTTPS');}
}
async function detect(){
 if(!isSecureContext||!navigator.xr||!navigator.xr.isSessionSupported){launch.disabled=true;launch.textContent='OPEN IN QUEST BROWSER';return;}
 try{const ok=await navigator.xr.isSessionSupported('immersive-vr');launch.disabled=!ok;launch.textContent=ok?'ENTER IMMERSIVE VR':'IMMERSIVE VR NOT AVAILABLE';}
 catch{launch.disabled=true;launch.textContent='IMMERSIVE VR NOT AVAILABLE';}
}
launch.addEventListener('click',()=>{if(!launch.disabled&&!session)startVR();});
window.addEventListener('poopbot:settings',e=>{settings={...settings,...e.detail};saveSettings();});
window.addEventListener('poopbot:page',e=>{if(session&&book){buildPage(e.detail.page);setStatus(e.detail.page.toUpperCase()+' PAGE');}});
detect();
