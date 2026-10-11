const memoryStore = new Map();
const store = {
  getItem(k){ try { return window.localStorage.getItem(k) } catch(e){ return memoryStore.has(k)?memoryStore.get(k):null } },
  setItem(k,v){ try { window.localStorage.setItem(k,v) } catch(e){ memoryStore.set(k,String(v)) } },
  removeItem(k){ try { window.localStorage.removeItem(k) } catch(e){ memoryStore.delete(k) } }
};
const sessionMemory = new Map();
const sessionStore = {
  getItem(k){ try { return window.sessionStorage.getItem(k) } catch(e){ return sessionMemory.has(k)?sessionMemory.get(k):null } },
  setItem(k,v){ try { window.sessionStorage.setItem(k,v) } catch(e){ sessionMemory.set(k,String(v)) } }
};

const I18N = {
 en:{
  brand:"My Health Ally",tag:"Better info • less worry • one step at a time",hello:"Hi, Mom. You’ve got this. 💙",
  hero:"A calm place to understand medicines, check new ideas before trying them, track symptoms, and bring better questions to your health team.",
  notalone:"No TikTok rabbit hole required.",safetyTitle:"Important:",safety:"This app organizes information. It does not replace the directions on your prescription label or instructions from your doctor or pharmacist.",
  qMeds:"My medicines",qMedsSub:"What they’re for, common effects, and what to confirm.",qScience:"The science",qScienceSub:"What’s established, promising, or still uncertain.",
  qLog:"Log symptoms",qLogSub:"Pain, allergies, mood, sleepiness, and notes.",qAsk:"Check something new",qAskSub:"Build a careful question for Google AI Mode.",
  askTitle:"Before I try this…",askSub:"Paste a drink, herb, vitamin, TikTok claim, or “miracle” remedy.",claimLabel:"What did you hear about?",
  claimPH:"Example: Is oregano oil good for allergies? Can I drink kombucha with my medicines?",askGoogle:"Ask Google AI Mode",copyPrompt:"Copy careful prompt",
  aiTip:"We ask for evidence quality, interactions, official sources, and clear “why / why not” reasoning. If Google drops the question, the prompt is copied so you can paste it.",
  medTitle:"Medicines",medSub:"From the medication list you and your health team are reconciling.",verify:"Verify current list",
  suppTitle:"Supplements & probiotics",suppSub:"Optional ideas to discuss — not substitutes for prescribed treatment.",
  scienceTitle:"The science — simplified",scienceSub:"Evidence strength matters more than whether something is “natural” or “prescription.”",
  remTitle:"Reminders",remSub:"Create reminders only after the health team confirms the schedule.",confirmFirst:"Confirm first",
  remPH:"e.g., morning inhaler",saveReminder:"Save reminder",enableNotify:"Enable notifications",
  notifyNote:"On iPhone, browser notifications work best after adding this app to the Home Screen. Background scheduled push requires a server, so this version also lets you add a reminder to Calendar.",
  logTitle:"Pain & symptom log",logSub:"Saved only on this device unless you export it.",feelLabel:"How are you feeling overall today?",pain:"Pain (0–10)",
  sleepy:"Sleepiness / fog (0–10)",symptoms:"Symptoms today",notes:"Notes / what may have triggered it",saveLog:"Save today’s log",exportLog:"Export CSV",clearLogs:"Clear logs",
  trustedTitle:"Trusted starting points",trustedSub:"Use these when a claim feels confusing or scary.",medline:"Plain-language medicine information from the U.S. National Library of Medicine.",
  nccih:"NIH evidence on supplements, herbs, and complementary approaches.",fda:"Drug labels, safety notices, and official U.S. regulatory information.",
  install:"Add to Home Screen",installSub:"Make this feel like an app on iPhone.",privacyTitle:"Privacy",
  privacy:"Symptom logs and reminders are stored in your browser on this device. They are not sent to this website or GitHub. When you choose “Ask Google AI Mode,” the question you enter is sent to Google in a new window.",
  footer:"Made with care for Mom • Better questions, calmer decisions.",beautyLink:"Open the original beauty routine →",
  navCheck:"Check",navMeds:"Meds",navScience:"Science",navLog:"Log",navRem:"Remind",
  installTitle:"Put Health Ally on the iPhone Home Screen",install1:"1. Open this page in Safari.",install2:"2. Tap the Share button.",install3:"3. Choose “Add to Home Screen.”",install4:"4. Open it from the new icon. Then use “Enable notifications” if desired.",done:"Done"
 },
 es:{
  brand:"Mi Aliado de Salud",tag:"Mejor información • menos preocupación • paso a paso",hello:"Hola, Mamá. Tú puedes. 💙",
  hero:"Un lugar tranquilo para entender tus medicinas, revisar ideas nuevas antes de probarlas, registrar síntomas y llevar mejores preguntas a tu equipo de salud.",
  notalone:"Sin caer en el túnel de TikTok.",safetyTitle:"Importante:",safety:"Esta app organiza información. No reemplaza las instrucciones de la etiqueta de tus medicinas ni las indicaciones de tu médico o farmacéutico.",
  qMeds:"Mis medicinas",qMedsSub:"Para qué pueden usarse, efectos comunes y qué confirmar.",qScience:"La ciencia",qScienceSub:"Qué está bien establecido, qué promete y qué sigue incierto.",
  qLog:"Registrar síntomas",qLogSub:"Dolor, alergias, ánimo, sueño y notas.",qAsk:"Revisar algo nuevo",qAskSub:"Crear una pregunta cuidadosa para Google AI Mode.",
  askTitle:"Antes de probar esto…",askSub:"Escribe una bebida, hierba, vitamina, consejo de TikTok o remedio “milagroso”.",claimLabel:"¿Qué escuchaste o viste?",
  claimPH:"Ejemplo: ¿El aceite de orégano ayuda con alergias? ¿Puedo tomar kombucha con mis medicinas?",askGoogle:"Preguntar a Google AI Mode",copyPrompt:"Copiar pregunta cuidadosa",
  aiTip:"Pedimos calidad de evidencia, interacciones, fuentes oficiales y una explicación clara de “por qué sí / por qué no”. Si Google pierde la pregunta, queda copiada para pegarla.",
  medTitle:"Medicinas",medSub:"De la lista que tú y tu equipo de salud están revisando.",verify:"Confirmar lista actual",
  suppTitle:"Suplementos y probióticos",suppSub:"Ideas opcionales para hablar con el equipo — no reemplazan tratamientos recetados.",
  scienceTitle:"La ciencia — en sencillo",scienceSub:"La calidad de la evidencia importa más que si algo es “natural” o “recetado”.",
  remTitle:"Recordatorios",remSub:"Crea recordatorios solo después de que el equipo confirme el horario.",confirmFirst:"Confirmar primero",
  remPH:"ej., inhalador de la mañana",saveReminder:"Guardar recordatorio",enableNotify:"Activar notificaciones",
  notifyNote:"En iPhone, las notificaciones funcionan mejor después de agregar esta app a la pantalla de inicio. Las notificaciones programadas en segundo plano requieren un servidor, así que esta versión también permite agregar un recordatorio al Calendario.",
  logTitle:"Registro de dolor y síntomas",logSub:"Se guarda solo en este dispositivo a menos que lo exportes.",feelLabel:"¿Cómo te sientes hoy en general?",pain:"Dolor (0–10)",
  sleepy:"Sueño / mente nublada (0–10)",symptoms:"Síntomas de hoy",notes:"Notas / qué pudo provocarlo",saveLog:"Guardar registro de hoy",exportLog:"Exportar CSV",clearLogs:"Borrar registros",
  trustedTitle:"Fuentes confiables",trustedSub:"Úsalas cuando una afirmación te confunda o asuste.",medline:"Información clara sobre medicinas de la Biblioteca Nacional de Medicina de EE. UU.",
  nccih:"Evidencia de NIH sobre suplementos, hierbas y enfoques complementarios.",fda:"Etiquetas de medicamentos, avisos de seguridad e información oficial de EE. UU.",
  install:"Agregar a pantalla de inicio",installSub:"Haz que se sienta como una app en iPhone.",privacyTitle:"Privacidad",
  privacy:"Los registros de síntomas y recordatorios se guardan en el navegador de este dispositivo. No se envían a este sitio ni a GitHub. Al elegir “Preguntar a Google AI Mode”, la pregunta se envía a Google en una ventana nueva.",
  footer:"Hecho con cariño para Mamá • Mejores preguntas, decisiones más tranquilas.",beautyLink:"Abrir la rutina de belleza original →",
  navCheck:"Revisar",navMeds:"Medicinas",navScience:"Ciencia",navLog:"Registro",navRem:"Avisos",
  installTitle:"Pon Health Ally en la pantalla de inicio del iPhone",install1:"1. Abre esta página en Safari.",install2:"2. Toca el botón Compartir.",install3:"3. Elige “Agregar a pantalla de inicio”.",install4:"4. Ábrela desde el nuevo icono. Luego usa “Activar notificaciones” si quieres.",done:"Listo"
 }
};

const meds = [
 {name:"Albuterol", icon:"🫁", status:"verify", en:{why:"A rescue bronchodilator often used for quick relief of wheezing or bronchospasm.", common:"Shakiness, faster heartbeat, nervous feeling, headache.", watch:"Seek urgent help for severe breathing trouble or if rescue treatment is not working as directed."}, es:{why:"Broncodilatador de rescate usado con frecuencia para alivio rápido de sibilancias o broncoespasmo.",common:"Temblor, latido rápido, nerviosismo, dolor de cabeza.",watch:"Busca ayuda urgente si hay dificultad respiratoria intensa o si el tratamiento de rescate no funciona como se indicó."}},
 {name:"Aspirin", icon:"❤️", status:"verify", en:{why:"May be used for cardiovascular prevention or pain, depending on the prescription.",common:"Stomach upset, bruising, bleeding more easily.",watch:"Confirm the reason and whether it is meant to overlap with naproxen or prednisone."}, es:{why:"Puede usarse para prevención cardiovascular o dolor, según la indicación.",common:"Malestar estomacal, moretones, sangrado más fácil.",watch:"Confirma la razón y si debe coincidir con naproxeno o prednisona."}},
 {name:"Atorvastatin", icon:"🫀", status:"verify", en:{why:"Lowers LDL cholesterol and cardiovascular risk.",common:"Muscle aches, digestive symptoms; many people have no noticeable effects.",watch:"Report severe muscle pain/weakness or dark urine promptly."}, es:{why:"Reduce colesterol LDL y riesgo cardiovascular.",common:"Dolor muscular, síntomas digestivos; muchas personas no notan efectos.",watch:"Informa pronto dolor o debilidad muscular intensos u orina oscura."}},
 {name:"Cetirizine (Zyrtec)", icon:"🌼", status:"notstarted", en:{why:"Second-generation antihistamine for sneezing, itching and runny nose.",common:"Sleepiness, fatigue, dry mouth in some people.",watch:"Your source list says it was prescribed but not started. That is different from having had a bad reaction."}, es:{why:"Antihistamínico de segunda generación para estornudos, picazón y moqueo.",common:"Sueño, cansancio o boca seca en algunas personas.",watch:"La lista fuente dice que fue recetada pero no iniciada. Eso es distinto a haber tenido una reacción."}},
 {name:"Diclofenac topical", icon:"🦵", status:"verify", en:{why:"Topical NSAID used for localized joint or musculoskeletal pain.",common:"Skin irritation where applied.",watch:"Confirm whether it should be used at the same time as oral NSAIDs such as naproxen."}, es:{why:"AINE tópico usado para dolor localizado de articulaciones o músculos.",common:"Irritación de piel en el área aplicada.",watch:"Confirma si debe usarse al mismo tiempo que AINE orales como naproxeno."}},
 {name:"Fluticasone–salmeterol inhaler", icon:"🌬️", status:"verify", en:{why:"Controller inhaler combining an inhaled steroid with a long-acting bronchodilator.",common:"Hoarseness, throat irritation, oral thrush; rinse mouth after use if directed.",watch:"This inhaler is not the same product as fluticasone nasal spray."}, es:{why:"Inhalador de control que combina esteroide inhalado con broncodilatador de acción prolongada.",common:"Ronquera, irritación de garganta, hongos en boca; enjuaga la boca después si se indicó.",watch:"Este inhalador no es lo mismo que el spray nasal de fluticasona."}},
 {name:"Liraglutide", icon:"💉", status:"verify", en:{why:"GLP-1 medicine used for diabetes and, in some formulations, weight management.",common:"Nausea, fullness, vomiting, diarrhea or constipation.",watch:"Persistent severe abdominal pain or repeated vomiting needs prompt medical attention."}, es:{why:"Medicamento GLP-1 usado para diabetes y, en algunas presentaciones, control de peso.",common:"Náusea, llenura, vómito, diarrea o estreñimiento.",watch:"Dolor abdominal intenso persistente o vómitos repetidos requieren atención pronta."}},
 {name:"Metformin", icon:"🩸", status:"verify", en:{why:"Common first-line medicine that lowers blood glucose and improves insulin sensitivity.",common:"Nausea, loose stools, stomach upset, especially when starting.",watch:"Confirm the exact formulation and label directions; extended-release and immediate-release schedules differ."}, es:{why:"Medicamento común que baja glucosa y mejora la sensibilidad a la insulina.",common:"Náusea, heces sueltas y malestar estomacal, sobre todo al inicio.",watch:"Confirma la formulación y las instrucciones; liberación prolongada e inmediata tienen horarios distintos."}},
 {name:"Naproxen", icon:"🦴", status:"verify", en:{why:"NSAID for pain and inflammation.",common:"Heartburn, stomach upset, dizziness.",watch:"GI bleeding and kidney risks increase with certain other medicines. Confirm overlap with aspirin, prednisone and diclofenac."}, es:{why:"AINE para dolor e inflamación.",common:"Acidez, malestar estomacal, mareo.",watch:"El riesgo de sangrado gastrointestinal y riñón aumenta con ciertos medicamentos. Confirma la combinación con aspirina, prednisona y diclofenaco."}},
 {name:"Prednisone", icon:"🛡️", status:"verify", en:{why:"Corticosteroid used short-term for inflammation or allergic/respiratory flares, depending on the diagnosis.",common:"Higher blood sugar, appetite changes, insomnia, mood changes, stomach upset.",watch:"If this is a taper, use only the exact current taper instructions from the prescriber."}, es:{why:"Corticoide usado a corto plazo para inflamación o brotes alérgicos/respiratorios, según el diagnóstico.",common:"Glucosa más alta, cambios de apetito, insomnio, cambios de ánimo, malestar estomacal.",watch:"Si es una reducción gradual, usa únicamente las instrucciones actuales exactas del médico."}},
 {name:"Spironolactone", icon:"💧", status:"verify", en:{why:"Potassium-sparing diuretic used for several conditions such as blood pressure, fluid balance or hormone-related indications.",common:"More urination, dizziness, breast tenderness; potassium can rise.",watch:"Confirm the reason for use and whether potassium/kidney labs are being followed."}, es:{why:"Diurético que conserva potasio, usado para presión, líquidos u otras indicaciones.",common:"Más orina, mareo, sensibilidad en senos; puede subir el potasio.",watch:"Confirma la razón de uso y si están vigilando potasio y función renal."}}
];

const supplements = [
 {name:"Probiotics", icon:"🧫", tier:"limited", en:{why:"Some studies suggest certain strains may improve allergic-rhinitis symptoms or quality of life.",common:"Gas or bloating can occur at first.",watch:"Benefits are strain-specific; there is no single proven 'allergy probiotic' for everyone."}, es:{why:"Algunos estudios sugieren que ciertas cepas pueden mejorar síntomas o calidad de vida en rinitis alérgica.",common:"Puede haber gas o inflamación al principio.",watch:"Los beneficios dependen de la cepa; no existe un único 'probiótico para alergias' comprobado para todos."}},
 {name:"Quercetin", icon:"🍎", tier:"prelim", en:{why:"A flavonoid studied for mast-cell and antihistamine-like effects.",common:"Usually tolerated in foods; concentrated supplements can cause headache or stomach symptoms.",watch:"Evidence for treating allergic rhinitis is preliminary; review interactions before using concentrated doses."}, es:{why:"Flavonoide estudiado por efectos sobre mastocitos y tipo antihistamínico.",common:"En alimentos suele tolerarse; suplementos concentrados pueden causar dolor de cabeza o estómago.",watch:"La evidencia para rinitis alérgica es preliminar; revisa interacciones antes de usar dosis concentradas."}},
 {name:"Spirulina", icon:"🌿", tier:"prelim", en:{why:"Blue-green algae studied in small trials for allergy symptoms and immune markers.",common:"Digestive upset can occur.",watch:"Not equivalent to established allergy treatment; product purity matters."}, es:{why:"Alga verde-azulada estudiada en ensayos pequeños para síntomas de alergia y marcadores inmunes.",common:"Puede causar malestar digestivo.",watch:"No equivale a tratamiento de alergia bien establecido; importa la pureza del producto."}},
 {name:"Stinging nettle", icon:"🌱", tier:"prelim", en:{why:"Traditional herb studied for allergy symptoms.",common:"Stomach upset, sweating, rash or urinary effects are possible.",watch:"May affect fluid balance or glucose; avoid casually stacking it with multiple medicines."}, es:{why:"Hierba tradicional estudiada para síntomas de alergia.",common:"Puede causar malestar estomacal, sudor, sarpullido o cambios urinarios.",watch:"Puede afectar líquidos o glucosa; evita combinarla casualmente con muchas medicinas."}},
 {name:"Local honey", icon:"🍯", tier:"insufficient", en:{why:"Popular theory: local pollen exposure might 'train' the immune system.",common:"Sugar load; allergy risk in susceptible people.",watch:"Evidence is not convincing for seasonal-allergy relief; sugar content also matters with diabetes."}, es:{why:"Teoría popular: el polen local podría 'entrenar' al sistema inmune.",common:"Carga de azúcar; posible alergia en personas susceptibles.",watch:"La evidencia no es convincente para aliviar alergias estacionales; el azúcar también importa con diabetes."}}
];

const evidence = [
 {cls:"established", titleEn:"Strong / established", titleEs:"Fuerte / establecido", en:"Intranasal corticosteroids are guideline-preferred for persistent allergic rhinitis. Second-generation antihistamines, azelastine nasal spray and allergy eye drops have established roles.", es:"Los corticoides intranasales son preferidos por guías para rinitis alérgica persistente. Antihistamínicos de segunda generación, azelastina nasal y gotas para alergia ocular tienen funciones bien establecidas."},
 {cls:"supportive", titleEn:"Supportive", titleEs:"De apoyo", en:"Saline nasal irrigation can modestly improve nasal symptoms. Use distilled, sterile, or previously boiled-and-cooled water.", es:"Los lavados nasales con solución salina pueden mejorar modestamente los síntomas. Usa agua destilada, estéril o previamente hervida y enfriada."},
 {cls:"prelim", titleEn:"Promising but preliminary", titleEs:"Prometedor pero preliminar", en:"Some probiotic strains, quercetin and spirulina have been studied, but evidence is inconsistent or not strong enough to treat them as equivalent to established therapies.", es:"Algunas cepas probióticas, quercetina y spirulina se han estudiado, pero la evidencia es inconsistente o insuficiente para tratarlas como equivalentes a terapias establecidas."},
 {cls:"insufficient", titleEn:"Insufficient / popular claim", titleEs:"Insuficiente / afirmación popular", en:"Local honey does not have convincing evidence for seasonal-allergy relief. 'Natural' does not automatically mean safer or interaction-free.", es:"La miel local no tiene evidencia convincente para aliviar alergias estacionales. 'Natural' no significa automáticamente más seguro ni libre de interacciones."}
];

const symptoms = {
 en:["Runny nose","Nasal congestion","Sneezing","Itchy / red eyes","Dry eyes","Wheezing / breathing change","Headache","Dizziness","Nausea","Mood / anxiety change"],
 es:["Moqueo","Congestión nasal","Estornudos","Ojos rojos / con picazón","Ojos secos","Sibilancias / cambio al respirar","Dolor de cabeza","Mareo","Náusea","Cambio de ánimo / ansiedad"]
};