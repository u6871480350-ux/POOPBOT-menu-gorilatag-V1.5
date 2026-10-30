const DEFAULTS={particles:true,glow:true,reducedMotion:false,sound:true,haptics:true,volume:35};
const KEY='poopbot-v2-settings';
let settings={...DEFAULTS};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');settings={...settings,...Object.fromEntries(Object.keys(DEFAULTS).filter(k=>k in saved).map(k=>[k,saved[k]]))};}catch{}
const $=(s)=>document.querySelector(s);
const status=$('#status'),toast=$('#toast');
let toastTimer;
function announce(message){status.textContent=message;toast.textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.textContent='';status.textContent='SYSTEM READY • V2.0';},2400);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(settings));$('#save-state').textContent='SAVED';}catch{$('#save-state').textContent='SESSION ONLY';}}
function syncControls(){document.querySelectorAll('[data-setting]').forEach(b=>{const key=b.dataset.setting,on=!!settings[key];b.setAttribute('aria-pressed',String(on));b.textContent=on?'ON':'OFF';});$('#volume').value=settings.volume;$('#volume-label').textContent=settings.volume+'%';document.body.classList.toggle('reduced-motion',settings.reducedMotion);}
function navigate(page){if(!document.querySelector('[data-view="'+page+'"]'))return;document.querySelectorAll('[data-view]').forEach(v=>v.classList.toggle('active',v.dataset.view===page));document.querySelectorAll('[data-page]').forEach(b=>{if(b.tagName==='BUTTON'&&b.closest('.nav')){if(b.dataset.page===page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}});announce(page.toUpperCase()+' PAGE');window.dispatchEvent(new CustomEvent('poopbot:page',{detail:{page}}));}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
document.querySelectorAll('[data-setting]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.setting;settings[key]=!settings[key];syncControls();save();announce(key.toUpperCase()+' '+(settings[key]?'ON':'OFF'));window.dispatchEvent(new CustomEvent('poopbot:settings',{detail:{...settings}}));}));
$('#volume').addEventListener('input',e=>{settings.volume=Number(e.target.value);$('#volume-label').textContent=settings.volume+'%';save();window.dispatchEvent(new CustomEvent('poopbot:settings',{detail:{...settings}}));});
function tone(){if(!settings.sound){announce('TURN INTERFACE SOUNDS ON FIRST');return;}try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('unsupported');const ctx=new AC(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(660,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+.12);gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.12*(settings.volume/100),ctx.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.22);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.23);osc.onended=()=>ctx.close();announce('TEST SOUND PLAYED');}catch{announce('AUDIO NOT AVAILABLE');}}
$('#test-sound').addEventListener('click',tone);
$('#reset-settings').addEventListener('click',()=>{settings={...DEFAULTS};syncControls();save();announce('SETTINGS RESET');window.dispatchEvent(new CustomEvent('poopbot:settings',{detail:{...settings}}));});
document.querySelectorAll('button').forEach(b=>{b.addEventListener('pointerdown',()=>b.classList.add('pressed'));['pointerup','pointercancel','pointerleave'].forEach(e=>b.addEventListener(e,()=>b.classList.remove('pressed')));});
syncControls();
if('serviceWorker'in navigator&&location.protocol!=='file:'){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('Service worker registration failed',e)));}
window.Poopbot={getSettings:()=>({...settings}),navigate,announce};
