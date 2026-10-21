let lang = store.getItem("healthAllyLang") || "es";
let mood = null;

function t(k){return I18N[lang][k] || k}
function applyLang(){
 document.documentElement.lang=lang;
 document.querySelectorAll("[data-t]").forEach(el=>{let v=t(el.dataset.t); if(v) el.textContent=v});
 document.querySelectorAll("[data-ph]").forEach(el=>el.placeholder=t(el.dataset.ph));
 document.getElementById("langBtn").textContent=lang==="en"?"ES":"EN";
 renderMeds(); renderSupps(); renderEvidence(); renderSymptoms(); renderHistory(); renderReminders();
 if(typeof renderFastingUI==="function"){const m=document.getElementById("mealIdea");if(m)m.textContent="";renderFastingUI();}
}
function go(id){document.getElementById(id).scrollIntoView({behavior:"smooth",block:"start"})}
document.getElementById("langBtn").onclick=()=>{lang=lang==="en"?"es":"en";store.setItem("healthAllyLang",lang);applyLang()};

function statusLabel(s){
 if(s==="notstarted") return lang==="en"?"Prescribed • not started":"Recetada • no iniciada";
 if(s==="historical") return lang==="en"?"Historical • verify":"Histórico • confirmar";
 return lang==="en"?"Verify with team":"Confirmar con equipo";
}
function renderMeds(){
 const box=document.getElementById("medList"); box.innerHTML="";
 meds.forEach(m=>{
  const d=m[lang];
  box.insertAdjacentHTML("beforeend",`<details class="item">
   <summary><span class="dot">${m.icon}</span><span class="sumtxt"><b>${m.name}</b><small>${d.why}</small></span><span class="pill verify">${statusLabel(m.status)}</span><span class="chev">›</span></summary>
   <div class="details"><h4>${lang==="en"?"Common effects":"Efectos comunes"}</h4><p>${d.common}</p>
   <h4>${lang==="en"?"Important to confirm":"Importante confirmar"}</h4><p>${d.watch}</p>
   <div class="tagrow"><button class="btn soft" onclick="askAbout('${m.name.replaceAll("'","\\'")}')">${lang==="en"?"Ask Google AI about this":"Preguntar a Google AI"}</button></div></div>
  </details>`);
 });
}
function renderSupps(){
 const box=document.getElementById("suppList"); box.innerHTML="";
 supplements.forEach(m=>{
  const d=m[lang]; const tier = m.tier==="limited"?(lang==="en"?"Limited / mixed":"Limitada / mixta"):m.tier==="prelim"?(lang==="en"?"Preliminary":"Preliminar"):(lang==="en"?"Insufficient":"Insuficiente");
  box.insertAdjacentHTML("beforeend",`<details class="item">
   <summary><span class="dot">${m.icon}</span><span class="sumtxt"><b>${m.name}</b><small>${d.why}</small></span><span class="pill ${m.tier==='insufficient'?'none':'limited'}">${tier}</span><span class="chev">›</span></summary>
   <div class="details"><h4>${lang==="en"?"Possible effects":"Posibles efectos"}</h4><p>${d.common}</p><h4>${lang==="en"?"Evidence / caution":"Evidencia / precaución"}</h4><p>${d.watch}</p>
   <button class="btn soft" onclick="askAbout('${m.name.replaceAll("'","\\'")}')">${lang==="en"?"Check this in Google AI":"Revisar en Google AI"}</button></div>
  </details>`);
 });
}
function renderEvidence(){
 document.getElementById("evidence").innerHTML=evidence.map(e=>`<div class="e-card ${e.cls}"><strong>${lang==="en"?e.titleEn:e.titleEs}</strong><p>${e[lang]}</p></div>`).join("");
}
function renderSymptoms(){
 const box=document.getElementById("symptomChecks");box.innerHTML="";
 symptoms[lang].forEach((s,i)=>box.insertAdjacentHTML("beforeend",`<label class="check"><input type="checkbox" value="${i}"> ${s}</label>`));
}
function currentMedNames(){return meds.map(m=>m.name).join(", ")}
function buildPrompt(claim){
 const base = lang==="en"
 ? `Evaluate this health claim or product for an adult woman taking multiple medicines: ${currentMedNames()}. The question is: "${claim}". Please explain in simple language: (1) what it is claimed to do, (2) how strong the human evidence is, (3) known or plausible medicine interactions and who should avoid it, (4) common and serious side effects, (5) whether it is reasonable to discuss with her doctor or pharmacist, and (6) what would make this urgent. Prioritize FDA, NIH/NCCIH, MedlinePlus, professional allergy guidelines, and peer-reviewed human studies. Separate established evidence from preliminary theories. Do not tell her to stop or change prescription medicine without her clinician.`
 : `Evalúa esta afirmación o producto de salud para una mujer adulta que toma varios medicamentos: ${currentMedNames()}. La pregunta es: "${claim}". Explica en lenguaje sencillo: (1) qué se supone que hace, (2) qué tan sólida es la evidencia en humanos, (3) interacciones conocidas o posibles con medicamentos y quién debería evitarlo, (4) efectos secundarios comunes y graves, (5) si es razonable hablarlo con su médico o farmacéutico, y (6) qué señales lo harían urgente. Prioriza FDA, NIH/NCCIH, MedlinePlus, guías profesionales de alergia y estudios humanos revisados por pares. Separa evidencia establecida de teorías preliminares. No le indiques suspender ni cambiar medicinas recetadas sin su equipo clínico.`;
 return base;
}
async function copyText(s){try{await navigator.clipboard.writeText(s);return true}catch(e){return false}}
document.getElementById("copyBtn").onclick=async()=>{const c=document.getElementById("claim").value.trim();if(!c)return;await copyText(buildPrompt(c));alert(lang==="en"?"Prompt copied.":"Pregunta copiada.")};
document.getElementById("aiBtn").onclick=async()=>{const c=document.getElementById("claim").value.trim();if(!c)return;const p=buildPrompt(c);await copyText(p);window.open("https://www.google.com/search?udm=50&q="+encodeURIComponent(p),"_blank","noopener")};
function askAbout(name){document.getElementById("claim").value=lang==="en"?`Is ${name} safe and useful for me, and what should I know about interactions or side effects?`:`¿${name} es seguro y útil para mí y qué debo saber sobre interacciones o efectos secundarios?`;go("ask")}
