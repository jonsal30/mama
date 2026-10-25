const HEALTH_ALLY_API="https://health-ally-push.jonsal30.workers.dev";
const HEALTH_ALLY_VAPID_PUBLIC_KEY="BDDYhXUfboghspiGOjlFQ8W9NtNEkUaksT83xMFHJoIxE_L5DLkp-geukdtCBe24x4RRYWSDe4DXkB_-p2vaIyA";
const HA_DEVICE_KEY="healthAllyDeviceId";
const HA_TOKEN_KEY="healthAllyBackendToken";

function haDeviceId(){
 let id=store.getItem(HA_DEVICE_KEY);
 if(!id){id=(crypto.randomUUID?crypto.randomUUID():`ha-${Date.now()}-${Math.random().toString(36).slice(2)}`);store.setItem(HA_DEVICE_KEY,id)}
 return id;
}
function haToken(){return store.getItem(HA_TOKEN_KEY)||""}
function urlBase64ToUint8Array(base64String){
 const padding="=".repeat((4-base64String.length%4)%4),base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
 const raw=atob(base64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
}
async function haFetch(path,body,opts={}){
 const headers={"Content-Type":"application/json",...(opts.auth===false?{}:{"Authorization":`Bearer ${haToken()}`})};
 const r=await fetch(HEALTH_ALLY_API+path,{method:opts.method||"POST",headers,body:body===undefined?undefined:JSON.stringify(body)});
 const j=await r.json().catch(()=>({ok:false,error:`http_${r.status}`}));
 if(!r.ok||j.ok===false)throw new Error(j.error||`http_${r.status}`);return j;
}
async function haPair(pairingCode){
 const j=await haFetch("/api/pair",{deviceId:haDeviceId(),pairingCode,lang},{auth:false});
 store.setItem(HA_TOKEN_KEY,j.token);return true;
}
async function haLog(eventType,payload,ts=new Date().toISOString()){
 if(!haToken())return {ok:false,queued:false,error:"not_paired"};
 const eventId=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;
 try{return await haFetch("/api/log",{eventId,eventType,ts,payload})}catch(e){console.warn("Health Ally sync failed",e);return {ok:false,error:String(e)}}
}
async function haScheduleFastEnd(state){
 if(!haToken()||!state?.targetEnd)return {ok:false};
 const key=`fast-end-${new Date(state.targetEnd).getTime()}`;
 const copy={
  titleEs:"💙 YA PUEDES COMER",bodyEs:"Completaste tu meta de hoy. No necesitas extender el ayuno. Abre Health Ally y confirma que viste este aviso.",
  titleEn:"💙 YOU CAN EAT NOW",bodyEn:"You completed today's goal. You do not need to extend the fast. Open Health Ally and confirm you saw this alert."
 };
 try{const j=await haFetch("/api/schedule",{jobKey:key,kind:"fast_end",dueAt:state.targetEnd,maxAttempts:3,copy});store.setItem("healthAllyCurrentFastJob",key);return j}catch(e){console.warn("Push schedule failed",e);return {ok:false,error:String(e)}}
}
async function haAck(jobKey,status="seen"){
 if(!haToken()||!jobKey)return;
 try{await haFetch("/api/ack",{jobKey,status});if("clearAppBadge" in navigator)navigator.clearAppBadge().catch(()=>{});return true}catch(e){console.warn("Push ack failed",e);return false}
}
async function haPushSubscription(){
 if(!haToken())throw new Error("not_paired");
 if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window))throw new Error("push_not_supported");
 const permission=await Notification.requestPermission();if(permission!=="granted")throw new Error("permission_not_granted");
 const reg=await navigator.serviceWorker.ready;
 let sub=await reg.pushManager.getSubscription();
 if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(HEALTH_ALLY_VAPID_PUBLIC_KEY)});
 await haFetch("/api/subscribe",{subscription:sub.toJSON(),lang});
 store.setItem("healthAllyPushEnabled","1");return sub;
}
async function enableHealthAllyPush(){
 try{
  if(!haToken()){
   const code=prompt(lang==="es"?"Código de configuración (John lo tiene):":"Setup code (John has it):");
   if(!code)return;
   await haPair(code.trim());
  }
  await haPushSubscription();
  renderBackendStatus();
  alert(lang==="es"?"✅ Avisos fuertes activados. Health Ally puede avisarte aunque la app esté cerrada.":"✅ Background push alerts are enabled. Health Ally can alert you even when the app is closed.");
 }catch(e){
  const msg=String(e&&e.message||e);
  let friendly=msg;
  if(msg.includes("pairing_closed"))friendly=lang==="es"?"Este dispositivo necesita que John reabra la configuración segura.":"This device needs John to reopen secure pairing.";
  if(msg.includes("push_not_supported"))friendly=lang==="es"?"En iPhone, abre Health Ally desde el icono de la pantalla de inicio para activar avisos.":"On iPhone, open Health Ally from its Home Screen icon to enable push alerts.";
  if(msg.includes("permission_not_granted"))friendly=lang==="es"?"No se concedió permiso de notificaciones. Puedes cambiarlo en Ajustes > Notificaciones.":"Notification permission was not granted. You can change it in Settings > Notifications.";
  alert(friendly);
 }
}
async function renderBackendStatus(){
 const el=document.getElementById("pushStatus");if(!el)return;
 if(!haToken()){el.className="backend-status warn";el.textContent=lang==="es"?"Avisos en segundo plano: falta configuración de una sola vez.":"Background alerts: one-time setup needed.";return}
 try{
  const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager?.getSubscription();
  if(sub&&Notification.permission==="granted"){el.className="backend-status good";el.textContent=lang==="es"?"✅ Avisos en segundo plano activos":"✅ Background push alerts active"}
  else{el.className="backend-status warn";el.textContent=lang==="es"?"Configurado, pero falta permitir notificaciones en este iPhone.":"Paired, but notification permission is still needed on this iPhone."}
 }catch(e){el.className="backend-status warn";el.textContent=lang==="es"?"Abre desde la pantalla de inicio para terminar los avisos.":"Open from the Home Screen to finish notification setup."}
}
function showPushAcknowledgement(jobKey,kind){
 const box=document.getElementById("pushAckBanner");if(!box||!jobKey)return;
 box.classList.remove("hidden");
 const title=document.getElementById("pushAckTitle"),body=document.getElementById("pushAckText");
 title.textContent=lang==="es"?"💙 YA PUEDES COMER":"💙 YOU CAN EAT NOW";
 body.textContent=lang==="es"?"El aviso seguirá repitiéndose hasta que confirmes que lo viste.":"The alert will keep repeating until you confirm you saw it.";
 const seen=document.getElementById("pushAckSeen"),ate=document.getElementById("pushAckAte");
 seen.textContent=lang==="es"?"✓ YA VI":"✓ I SAW IT";ate.textContent=lang==="es"?"🍽️ YA COMÍ":"🍽️ I ATE";
 seen.onclick=async()=>{await haAck(jobKey,"seen");box.classList.add("hidden");history.replaceState(null,"",location.pathname+location.hash)};
 ate.onclick=async()=>{await haAck(jobKey,"ate");box.classList.add("hidden");history.replaceState(null,"",location.pathname+location.hash)};
}
function initBackend(){
 const q=new URLSearchParams(location.search),job=q.get("push"),kind=q.get("kind");if(job)showPushAcknowledgement(job,kind);
 renderBackendStatus();
 window.addEventListener("focus",renderBackendStatus);
 navigator.serviceWorker?.addEventListener("message",e=>{if(e.data?.type==="health-ally-push")showPushAcknowledgement(e.data.jobKey,e.data.kind)});
}
