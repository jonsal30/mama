function reminders(){return JSON.parse(store.getItem("healthAllyReminders")||"[]")}
document.getElementById("saveReminder").onclick=()=>{
 const name=document.getElementById("remName").value.trim(),time=document.getElementById("remTime").value;if(!name||!time)return;
 let a=reminders();a.push({id:Date.now(),name,time});a.sort((x,y)=>x.time.localeCompare(y.time));store.setItem("healthAllyReminders",JSON.stringify(a));renderReminders();
 document.getElementById("remName").value="";
};
function renderReminders(){
 const box=document.getElementById("reminderList"),a=reminders();box.innerHTML="";
 a.forEach(r=>box.insertAdjacentHTML("beforeend",`<div class="reminder-row"><div class="time">${r.time}</div><div class="name">${r.name}</div><button class="btn soft" onclick="calendarReminder(${r.id})">📅</button><button class="btn danger" onclick="deleteReminder(${r.id})">×</button></div>`));
}
function deleteReminder(id){store.setItem("healthAllyReminders",JSON.stringify(reminders().filter(r=>r.id!==id)));renderReminders()}
function calendarReminder(id){
 const r=reminders().find(x=>x.id===id);if(!r)return;
 const [hh,mm]=r.time.split(":").map(Number),d=new Date();d.setHours(hh,mm,0,0);if(d<new Date())d.setDate(d.getDate()+1);
 const end=new Date(d.getTime()+10*60000);
 const f=x=>x.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
 const ics=`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Health Ally//EN\nBEGIN:VEVENT\nUID:${r.id}@healthally\nDTSTAMP:${f(new Date())}\nDTSTART:${f(d)}\nDTEND:${f(end)}\nSUMMARY:${r.name.replace(/\n/g," ")}\nDESCRIPTION:Health Ally reminder. Follow the confirmed prescription label / care-team plan.\nBEGIN:VALARM\nTRIGGER:-PT10M\nACTION:DISPLAY\nDESCRIPTION:${r.name.replace(/\n/g," ")}\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR`;
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));a.download="health-ally-reminder.ics";a.click();URL.revokeObjectURL(a.href);
}
document.getElementById("notifyBtn").onclick=async()=>{
 if(!("Notification" in window)){alert(lang==="en"?"Notifications are not available in this browser.":"Las notificaciones no están disponibles en este navegador.");return}
 const p=await Notification.requestPermission();alert(p==="granted"?(lang==="en"?"Notifications enabled while the app is active.":"Notificaciones activadas mientras la app esté activa."):(lang==="en"?"Permission not granted.":"Permiso no concedido."));
};
setInterval(()=>{
 if(!("Notification" in window)||Notification.permission!=="granted")return;
 const now=new Date(),hm=now.toTimeString().slice(0,5),stamp=now.toISOString().slice(0,10)+"-"+hm;
 reminders().forEach(r=>{
  const key="notified-"+r.id+"-"+stamp;
  if(r.time===hm&&!sessionStore.getItem(key)){new Notification(r.name,{body:lang==="en"?"Health Ally reminder — follow the confirmed care plan.":"Recordatorio de Health Ally — sigue el plan confirmado."});sessionStore.setItem(key,"1")}
 });
},30000);
