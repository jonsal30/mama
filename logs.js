document.querySelectorAll("#moodScale button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#moodScale button").forEach(x=>x.classList.remove("active"));b.classList.add("active");mood=+b.dataset.v});
function logs(){return JSON.parse(store.getItem("healthAllyLogs")||"[]")}
document.getElementById("saveLog").onclick=()=>{
 let selected=[...document.querySelectorAll("#symptomChecks input:checked")].map(x=>+x.value);
 let entry={ts:new Date().toISOString(),mood,pain:document.getElementById("pain").value,sleepy:document.getElementById("sleepy").value,symptoms:selected,note:document.getElementById("logNote").value.trim()};
 let all=logs();all.unshift(entry);store.setItem("healthAllyLogs",JSON.stringify(all.slice(0,90)));renderHistory();
 document.getElementById("logNote").value="";document.querySelectorAll("#symptomChecks input").forEach(x=>x.checked=false);
 alert(lang==="en"?"Saved on this device.":"Guardado en este dispositivo.");
};
function renderHistory(){
 const box=document.getElementById("history"),all=logs().slice(0,6);box.innerHTML="";
 if(!all.length){box.innerHTML=`<div class="tip">${lang==="en"?"No symptom logs yet.":"Aún no hay registros."}</div>`;return}
 all.forEach(e=>{
   const names=(e.symptoms||[]).map(i=>symptoms[lang][i]).join(", ")||"—";
   const d=new Date(e.ts).toLocaleString(lang==="en"?"en-US":"es-US",{dateStyle:"medium",timeStyle:"short"});
   box.insertAdjacentHTML("beforeend",`<div class="history-row"><b>${d}</b><small>${lang==="en"?"Mood":"Ánimo"}: ${e.mood||"—"} · ${lang==="en"?"Pain":"Dolor"}: ${e.pain||"—"} · ${lang==="en"?"Sleepiness":"Sueño"}: ${e.sleepy||"—"}</small><div>${names}</div>${e.note?`<div>${e.note}</div>`:""}</div>`);
 });
}
document.getElementById("clearLogs").onclick=()=>{if(confirm(lang==="en"?"Delete all local symptom logs?":"¿Borrar todos los registros locales?")){store.removeItem("healthAllyLogs");renderHistory()}};
document.getElementById("exportLog").onclick=()=>{
 const all=logs();if(!all.length)return;
 const rows=[["timestamp","mood","pain","sleepiness","symptoms","note"],...all.map(e=>[e.ts,e.mood||"",e.pain||"",e.sleepy||"", (e.symptoms||[]).map(i=>symptoms.en[i]).join("|"),e.note||""])];
 const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="health-ally-symptom-log.csv";a.click();URL.revokeObjectURL(a.href);
};
