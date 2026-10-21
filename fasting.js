const FAST_KEY="healthAllyFastState";
const FAST_HISTORY_KEY="healthAllyFastHistory";
const HEALTH_KEY="healthAllyHealthReadings";
const MED_ACK_KEY="healthAllyMedAcks";

const fastingStages={
 baseline:{hours:0,labelEn:"Baseline week",labelEs:"Semana base"},
 "12:12":{hours:12,labelEn:"12:12",labelEs:"12:12"},
 "14:10":{hours:14,labelEn:"14:10",labelEs:"14:10"},
 "16:8":{hours:16,labelEn:"16:8",labelEs:"16:8"}
};

const dailyMeds=[
 {id:"liraglutide",name:"Liraglutida",detailEn:"1.8 mg injection daily • current timing: morning",detailEs:"Inyección 1.8 mg diaria • horario actual: mañana",meal:false},
 {id:"metformin",name:"Metformina ER",detailEn:"500 mg • with the first meal of the day",detailEs:"500 mg • con la primera comida del día",meal:true},
 {id:"spironolactone",name:"Espironolactona",detailEn:"25 mg daily • verify current plan",detailEs:"25 mg diaria • confirmar plan actual",meal:false},
 {id:"aspirin",name:"Aspirina",detailEn:"81 mg daily • verify current plan",detailEs:"81 mg diaria • confirmar plan actual",meal:false},
 {id:"atorvastatin",name:"Atorvastatina",detailEn:"40 mg nightly",detailEs:"40 mg por la noche",meal:false},
 {id:"advair",name:"Advair Diskus",detailEn:"250/50 • twice daily as prescribed",detailEs:"250/50 • dos veces al día según receta",meal:false},
 {id:"cetirizine",name:"Cetirizina",detailEn:"10 mg daily • verify whether currently taking",detailEs:"10 mg diaria • confirmar si actualmente la toma",meal:false},
 {id:"albuterol",name:"Albuterol",detailEn:"Rescue inhaler • only as needed/as prescribed",detailEs:"Inhalador de rescate • solo si se necesita/según receta",prn:true}
];

const mealIdeas={
 es:[
  "Huevos + nopales + frijoles + 1–2 tortillas de maíz",
  "Pollo a la plancha + verduras + frijoles",
  "Pescado + ensalada + aguacate + una porción pequeña de arroz",
  "Yogur griego natural + fruta + nueces o semillas",
  "Avena con canela + nueces + una fuente de proteína",
  "Carne magra + calabacitas + frijoles + tortilla de maíz",
  "Ensalada grande + pollo o atún + frijoles + aguacate"
 ],
 en:[
  "Eggs + nopales + beans + 1–2 corn tortillas",
  "Grilled chicken + vegetables + beans",
  "Fish + salad + avocado + a small serving of rice",
  "Plain Greek yogurt + fruit + nuts or seeds",
  "Oatmeal with cinnamon + nuts + a protein source",
  "Lean meat + squash + beans + a corn tortilla",
  "Large salad + chicken or tuna + beans + avocado"
 ]
};

function fastState(){
 const fallback={stage:"baseline",active:false,start:null,targetEnd:null,baselineStart:new Date().toISOString(),lastSafety:"ok"};
 try{return {...fallback,...JSON.parse(store.getItem(FAST_KEY)||"{}")}}catch(e){return fallback}
}
function saveFastState(s){store.setItem(FAST_KEY,JSON.stringify(s))}
function fastHistory(){try{return JSON.parse(store.getItem(FAST_HISTORY_KEY)||"[]")}catch(e){return []}}
function saveFastHistory(a){store.setItem(FAST_HISTORY_KEY,JSON.stringify(a.slice(0,120)))}
function healthReadings(){try{return JSON.parse(store.getItem(HEALTH_KEY)||"[]")}catch(e){return []}}
function saveHealthReadings(a){store.setItem(HEALTH_KEY,JSON.stringify(a.slice(0,365)))}
function medAcks(){try{return JSON.parse(store.getItem(MED_ACK_KEY)||"{}")}catch(e){return {}}}
function saveMedAcks(a){store.setItem(MED_ACK_KEY,JSON.stringify(a))}
function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function fmtDateTime(v){if(!v)return"—";return new Date(v).toLocaleString(lang==="es"?"es-US":"en-US",{dateStyle:"medium",timeStyle:"short"})}
function fmtClock(v){if(!v)return"—";return new Date(v).toLocaleTimeString(lang==="es"?"es-US":"en-US",{hour:"numeric",minute:"2-digit"})}
function hoursSince(v){return v?(Date.now()-new Date(v).getTime())/3600000:0}

function baselineDays(){
 const s=fastState();
 return Math.max(0,Math.floor((Date.now()-new Date(s.baselineStart).getTime())/86400000)+1);
}
function stableCount(stage){return fastHistory().filter(x=>x.stage===stage&&x.completed&&x.safety==="ok").length}
function stageUnlocked(stage){
 if(stage==="baseline")return true;
 if(stage==="12:12")return baselineDays()>=7;
 if(stage==="14:10")return stableCount("12:12")>=7;
 if(stage==="16:8")return stableCount("14:10")>=7;
 return false;
}
function stageReason(stage){
 if(stage==="12:12"&&!stageUnlocked(stage))return lang==="es"?"Se desbloquea al completar 7 días de registro base.":"Unlocks after 7 baseline logging days.";
 if(stage==="14:10"&&!stageUnlocked(stage))return lang==="es"?"Se desbloquea después de 7 ayunos 12:12 estables.":"Unlocks after 7 stable 12:12 fasts.";
 if(stage==="16:8"&&!stageUnlocked(stage))return lang==="es"?"Se desbloquea después de 7 ayunos 14:10 estables.":"Unlocks after 7 stable 14:10 fasts.";
 return"";
}

function currentPhase(hours){
 if(hours<4)return {titleEs:"Después de comer",titleEn:"After eating",textEs:"Tu cuerpo sigue digiriendo y usando nutrientes de la comida.",textEn:"Your body is still digesting and using nutrients from the meal."};
 if(hours<12)return {titleEs:"Estado post-absorción",titleEn:"Post-absorptive phase",textEs:"La insulina suele ir bajando y aumenta gradualmente el uso de energía almacenada.",textEn:"Insulin generally falls and use of stored energy gradually increases."};
 if(hours<16)return {titleEs:"Mayor uso de energía almacenada",titleEn:"More stored-energy use",textEs:"La dependencia de grasa almacenada suele aumentar, pero la respuesta varía entre personas.",textEn:"Reliance on stored fat generally increases, but individual responses vary."};
 return {titleEs:"Ayuno más prolongado",titleEn:"Longer fasting",textEs:"Los cambios metabólicos continúan, pero más tiempo no significa automáticamente más beneficio. La autofagia no puede cronometrarse con precisión en humanos.",textEn:"Metabolic changes continue, but longer is not automatically better. Human autophagy cannot be timed precisely."};
}

function startFast(){
 const s=fastState();
 if(s.stage==="baseline")return alert(lang==="es"?"Esta semana es solo para registrar datos. Cuando completes la base, cambia a 12:12.":"This week is for baseline tracking. After that, move to 12:12.");
 const hours=fastingStages[s.stage].hours;
 const start=new Date();
 s.active=true;s.start=start.toISOString();s.targetEnd=new Date(start.getTime()+hours*3600000).toISOString();s.lastSafety="ok";
 saveFastState(s);renderFastingUI();
 notifyFriendly(lang==="es"?"Tu ayuno comenzó":"Your fast started",lang==="es"?`Meta de hoy: ${hours} horas. Puedes tomar agua. No necesitas extenderlo.`:`Today's goal: ${hours} hours. Water is okay. You do not need to extend it.`);
}
function endFast(reason="manual"){
 const s=fastState();if(!s.active)return;
 const elapsed=hoursSince(s.start),target=fastingStages[s.stage]?.hours||0;
 const completed=elapsed>=target-0.02;
 const hist=fastHistory();
 hist.unshift({ts:new Date().toISOString(),start:s.start,end:new Date().toISOString(),stage:s.stage,targetHours:target,elapsedHours:+elapsed.toFixed(2),completed,reason,safety:s.lastSafety||"ok"});
 saveFastHistory(hist);
 s.active=false;s.start=null;s.targetEnd=null;saveFastState(s);renderFastingUI();
}
function setStage(stage){
 if(!stageUnlocked(stage)){alert(stageReason(stage));return}
 const s=fastState();if(s.active)return alert(lang==="es"?"Termina el ayuno actual antes de cambiar de etapa.":"Finish the current fast before changing stage.");
 s.stage=stage;saveFastState(s);renderFastingUI();
}

function fastingSafety(glucose,symptoms,ketones){
 const urgent=symptoms.some(x=>["chest","sob","faint","confusion","vomit","deepBreath"].includes(x));
 if(urgent)return {level:"urgent",titleEs:"Necesita atención médica",titleEn:"Medical attention needed",textEs:"No continúes el ayuno. Dolor de pecho, falta de aire importante, desmayo, confusión, vómitos o respiración profunda/rápida requieren evaluación médica urgente.",textEn:"Do not continue the fast. Chest pain, significant shortness of breath, fainting, confusion, vomiting, or deep/rapid breathing need urgent medical evaluation."};
 if(Number.isFinite(glucose)&&glucose<=70)return {level:"stop",titleEs:"Detén el ayuno",titleEn:"Stop the fast",textEs:"Glucosa de 70 mg/dL o menos. Trata la glucosa baja según su plan de diabetes y vuelve a medir aproximadamente 15 minutos después. No intentes completar el reloj.",textEn:"Glucose is 70 mg/dL or lower. Treat the low according to her diabetes plan and recheck in about 15 minutes. Do not try to finish the timer."};
 if(Number.isFinite(glucose)&&glucose>=250)return {level:"warn",titleEs:"Glucosa alta — no extiendas el ayuno",titleEn:"High glucose — do not extend the fast",textEs:"Si se mantiene alrededor de 250 mg/dL o más, revisa cetonas si están disponibles/indicadas y sigue el plan de diabetes. No uses ejercicio intenso para corregirla, especialmente si hay cetonas.",textEn:"If it stays around 250 mg/dL or higher, check ketones if available/instructed and follow the diabetes plan. Do not use strenuous exercise to correct it, especially if ketones are present."};
 if(["moderate","large"].includes(ketones))return {level:"warn",titleEs:"Cetonas elevadas",titleEn:"Elevated ketones",textEs:"No continúes un ayuno prolongado ni hagas ejercicio intenso. Sigue el plan de diabetes y contacta al equipo médico según sus instrucciones.",textEn:"Do not continue a prolonged fast or do strenuous exercise. Follow the diabetes plan and contact the care team as instructed."};
 return {level:"ok",titleEs:"Sin alerta detectada en este registro",titleEn:"No alert detected in this entry",textEs:"Continúa solamente si se siente bien y sigue sus indicaciones médicas habituales.",textEn:"Continue only if she feels well and follows her usual medical instructions."};
}

function saveHealthCheck(){
 const glucoseRaw=document.getElementById("fastGlucose").value;
 const glucose=glucoseRaw===""?NaN:Number(glucoseRaw);
 const context=document.getElementById("glucoseContext").value;
 const sys=document.getElementById("bpSys").value, dia=document.getElementById("bpDia").value, weight=document.getElementById("fastWeight").value;
 const ketones=document.getElementById("ketones").value;
 const symptoms=[...document.querySelectorAll("#fastSymptoms input:checked")].map(x=>x.value);
 const note=document.getElementById("fastNote").value.trim();
 if(!Number.isFinite(glucose)&&!sys&&!dia&&!weight&&!symptoms.length&&!note&&ketones==="notchecked")return alert(lang==="es"?"Agrega al menos una medida o nota.":"Add at least one measurement or note.");
 const safety=fastingSafety(glucose,symptoms,ketones);
 const entry={ts:new Date().toISOString(),glucose:Number.isFinite(glucose)?glucose:null,context,sys:sys||null,dia:dia||null,weight:weight||null,ketones,symptoms,note,safety:safety.level};
 const all=healthReadings();all.unshift(entry);saveHealthReadings(all);
 const s=fastState();if(["urgent","stop","warn"].includes(safety.level))s.lastSafety=safety.level;saveFastState(s);
 if((safety.level==="urgent"||safety.level==="stop")&&s.active)endFast(safety.level);
 renderFastingUI();
 showSafety(safety);
}

function showSafety(safety){
 const box=document.getElementById("fastSafety");if(!box)return;
 box.className="fast-safety "+safety.level;
 box.innerHTML=`<b>${lang==="es"?safety.titleEs:safety.titleEn}</b><span>${lang==="es"?safety.textEs:safety.textEn}</span>`;
 box.scrollIntoView({behavior:"smooth",block:"center"});
}

function setMedAck(id,status){
 const all=medAcks(),day=todayKey();if(!all[day])all[day]={};all[day][id]={status,ts:new Date().toISOString()};saveMedAcks(all);renderMedAcks();
}
function renderMedAcks(){
 const box=document.getElementById("medAckList");if(!box)return;
 const day=medAcks()[todayKey()]||{};
 box.innerHTML=dailyMeds.map(m=>{
  const cur=day[m.id]?.status||"pending";
  const labels=lang==="es"?{taken:"✓ Tomada",pending:"Todavía no",skip:m.prn?"No se necesitó":"No tomada hoy",help:"Necesito ayuda"}:{taken:"✓ Taken",pending:"Not yet",skip:m.prn?"Not needed":"Not taken today",help:"Need help"};
  return `<div class="med-ack ${cur==='taken'?'done':''}"><div><b>${m.name}</b><small>${lang==="es"?m.detailEs:m.detailEn}${m.meal?`<br><strong>${lang==="es"?"Tomar con la primera comida según la lista actual.":"Take with the first meal per the current list."}</strong>`:""}</small></div><div class="ack-buttons"><button class="mini ${cur==='taken'?'active':''}" onclick="setMedAck('${m.id}','taken')">${labels.taken}</button><button class="mini ${cur==='pending'?'active':''}" onclick="setMedAck('${m.id}','pending')">${labels.pending}</button><button class="mini ${cur==='skip'?'active':''}" onclick="setMedAck('${m.id}','skip')">${labels.skip}</button><button class="mini ${cur==='help'?'active':''}" onclick="setMedAck('${m.id}','help')">${labels.help}</button></div></div>`;
 }).join("");
 const vals=Object.values(day);const taken=vals.filter(x=>x.status==="taken").length;
 const meter=document.getElementById("medAckSummary");if(meter)meter.textContent=lang==="es"?`${taken} medicamentos confirmados hoy`:`${taken} medicines confirmed today`;
}

function randomMeal(){
 const arr=mealIdeas[lang]||mealIdeas.es;const pick=arr[Math.floor(Math.random()*arr.length)];
 document.getElementById("mealIdea").textContent=pick;
}

function notifyFriendly(title,body){
 try{
  if("Notification" in window&&Notification.permission==="granted"){
   if(navigator.serviceWorker?.ready){navigator.serviceWorker.ready.then(r=>r.showNotification(title,{body,icon:"./icon.png",tag:"health-ally-fast"})).catch(()=>new Notification(title,{body}))}
   else new Notification(title,{body});
  }
 }catch(e){}
}
function enableFastingNotifications(){
 if(!("Notification" in window))return alert(lang==="es"?"Este navegador no ofrece notificaciones.":"This browser does not support notifications.");
 Notification.requestPermission().then(p=>alert(p==="granted"?(lang==="es"?"Avisos activados. Para avisos cuando la app esté cerrada, usa también el botón de Calendario.":"Alerts enabled. For alerts while the app is closed, also use the Calendar button."):(lang==="es"?"No se concedió permiso.":"Permission was not granted.")));
}
function calendarFastEnd(){
 const s=fastState();if(!s.active||!s.targetEnd)return alert(lang==="es"?"Primero inicia un ayuno.":"Start a fast first.");
 const d=new Date(s.targetEnd), end=new Date(d.getTime()+10*60000);
 const f=x=>x.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
 const summary=lang==="es"?"💙 YA PUEDES COMER — Health Ally":"💙 YOU CAN EAT NOW — Health Ally";
 const desc=lang==="es"?"Completaste la meta de hoy. No necesitas extender el ayuno. Come algo nutritivo y confirma las medicinas que correspondan con comida.":"You completed today's goal. You do not need to extend the fast. Eat something nourishing and confirm medicines that belong with food.";
 const ics=`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Health Ally//Mi Ventana//EN\nBEGIN:VEVENT\nUID:${Date.now()}@healthally\nDTSTAMP:${f(new Date())}\nDTSTART:${f(d)}\nDTEND:${f(end)}\nSUMMARY:${summary}\nDESCRIPTION:${desc}\nBEGIN:VALARM\nTRIGGER:PT0M\nACTION:DISPLAY\nDESCRIPTION:${summary}\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR`;
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));a.download="health-ally-you-can-eat.ics";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function renderFastHistory(){
 const box=document.getElementById("fastHistory");if(!box)return;
 const h=fastHistory().slice(0,5);
 if(!h.length){box.innerHTML=`<div class="tip">${lang==="es"?"Aún no hay ayunos completados.":"No completed fasts yet."}</div>`;return}
 box.innerHTML=h.map(x=>`<div class="history-row"><b>${x.stage} • ${x.elapsedHours}h</b><small>${fmtDateTime(x.end)} • ${x.completed?(lang==="es"?"meta completada":"goal completed"):(lang==="es"?"terminado antes":"ended early")} • ${x.safety}</small></div>`).join("");
}
function renderHealthHistory(){
 const box=document.getElementById("healthHistory");if(!box)return;
 const a=healthReadings().slice(0,5);
 if(!a.length){box.innerHTML=`<div class="tip">${lang==="es"?"Aún no hay medidas guardadas.":"No measurements saved yet."}</div>`;return}
 box.innerHTML=a.map(x=>`<div class="history-row"><b>${fmtDateTime(x.ts)}</b><small>${x.glucose!=null?`${lang==="es"?"Glucosa":"Glucose"}: ${x.glucose} (${x.context}) · `:""}${x.sys?`BP: ${x.sys}/${x.dia||"—"} · `:""}${x.weight?`${lang==="es"?"Peso":"Weight"}: ${x.weight} lb · `:""}${lang==="es"?"Seguridad":"Safety"}: ${x.safety}</small>${x.note?`<div>${x.note}</div>`:""}</div>`).join("");
}

function renderFastingUI(){
 const root=document.getElementById("window");if(!root)return;
 const s=fastState();const stage=fastingStages[s.stage];
 const stageBox=document.getElementById("stageButtons");
 if(stageBox)stageBox.innerHTML=["baseline","12:12","14:10","16:8"].map(k=>{const u=stageUnlocked(k),active=s.stage===k;return `<button class="stage-btn ${active?'active':''} ${u?'':'locked'}" onclick="setStage('${k}')" ${u?'':'aria-disabled="true"'}><b>${lang==="es"?fastingStages[k].labelEs:fastingStages[k].labelEn}</b><small>${k==='baseline'?(lang==="es"?`Día ${baselineDays()} de 7`:`Day ${baselineDays()} of 7`):(u?(lang==="es"?"Disponible":"Available"):stageReason(k))}</small></button>`}).join("");
 const status=document.getElementById("fastStatus");const timer=document.getElementById("fastTimer");const action=document.getElementById("fastAction");const endBtn=document.getElementById("fastEnd");const calBtn=document.getElementById("fastCalendar");
 if(s.stage==="baseline"){
  status.textContent=lang==="es"?"Semana base: registra glucosa, presión, peso, síntomas y medicinas sin cambiar todavía el horario de comida.":"Baseline week: log glucose, BP, weight, symptoms, and medicines without changing meal timing yet.";
  timer.textContent=lang==="es"?`Día ${baselineDays()} / 7`:`Day ${baselineDays()} / 7`;action.textContent=lang==="es"?"Semana de registro":"Logging week";action.disabled=true;endBtn.classList.add("hidden");calBtn.classList.add("hidden");
 }else if(s.active){
  const elapsed=Math.max(0,hoursSince(s.start)),remain=Math.max(0,(new Date(s.targetEnd).getTime()-Date.now())/3600000);const done=remain<=0;
  status.innerHTML=done?(lang==="es"?`<strong>💙 YA PUEDES COMER.</strong> Completaste tu meta. No necesitas extender el ayuno.`:`<strong>💙 YOU CAN EAT NOW.</strong> You completed your goal. You do not need to extend the fast.`):(lang==="es"?`Ayuno ${s.stage} en curso • termina aproximadamente a las <b>${fmtClock(s.targetEnd)}</b>.`:`${s.stage} fast in progress • target end about <b>${fmtClock(s.targetEnd)}</b>.`);
  timer.textContent=done?(lang==="es"?"Meta completa ✓":"Goal complete ✓"):`${elapsed.toFixed(1)}h / ${stage.hours}h`;
  action.textContent=done?(lang==="es"?"Terminar y comer":"Finish and eat"):(lang==="es"?"Ayuno en curso":"Fast in progress");action.disabled=!done;action.onclick=()=>endFast(done?"completed":"manual");endBtn.classList.remove("hidden");calBtn.classList.remove("hidden");
  const phase=currentPhase(elapsed);document.getElementById("phaseTitle").textContent=lang==="es"?phase.titleEs:phase.titleEn;document.getElementById("phaseText").textContent=lang==="es"?phase.textEs:phase.textEn;
  if(done)notifyFastDoneOnce(s);
 }else{
  status.textContent=lang==="es"?`Plan actual: ${s.stage}. Inicia el reloj después de la última comida.`:`Current plan: ${s.stage}. Start the timer after the last meal.`;
  timer.textContent=`${stage.hours}h`;action.textContent=lang==="es"?"Iniciar ayuno":"Start fast";action.disabled=false;action.onclick=startFast;endBtn.classList.add("hidden");calBtn.classList.add("hidden");
  document.getElementById("phaseTitle").textContent=lang==="es"?"El reloj aún no ha comenzado":"The timer has not started";document.getElementById("phaseText").textContent=lang==="es"?"Cuando inicies, aquí verás una explicación aproximada de la fase metabólica.":"When you start, this area will show an approximate metabolic-phase explanation.";
 }
 renderMedAcks();renderFastHistory();renderHealthHistory();if(!document.getElementById("mealIdea").textContent.trim())randomMeal();
}

function notifyFastDoneOnce(s){
 const key="fastdone-"+s.targetEnd;if(sessionStore.getItem(key))return;
 notifyFriendly(lang==="es"?"💙 YA PUEDES COMER":"💙 YOU CAN EAT NOW",lang==="es"?"Completaste tu meta de hoy. No necesitas extender el ayuno.":"You completed today's goal. You do not need to extend the fast.");sessionStore.setItem(key,"1");
}

function exportHealthAllyData(){
 const payload={exportedAt:new Date().toISOString(),fastState:fastState(),fastHistory:fastHistory(),healthReadings:healthReadings(),medicationAcknowledgements:medAcks()};
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));a.download="health-ally-mi-ventana.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function initFasting(){
 const root=document.getElementById("window");if(!root)return;
 if(!store.getItem(FAST_KEY)) saveFastState(fastState());
 document.getElementById("fastAction").onclick=startFast;
 document.getElementById("fastEnd").onclick=()=>endFast("manual");
 document.getElementById("saveHealthCheck").onclick=saveHealthCheck;
 document.getElementById("mealRefresh").onclick=randomMeal;
 document.getElementById("fastNotify").onclick=enableFastingNotifications;
 document.getElementById("fastCalendar").onclick=calendarFastEnd;
 document.getElementById("fastExport").onclick=exportHealthAllyData;
 setInterval(()=>renderFastingUI(),30000);
 renderFastingUI();
}
