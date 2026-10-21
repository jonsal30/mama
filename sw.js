const CACHE="health-ally-v4-mi-ventana";
const ASSETS=["./","./index.html","./styles.css","./data.js","./ui.js","./logs.js","./reminders.js","./fasting.js","./boot.js","./manifest.webmanifest","./app-icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
  }).catch(()=>caches.match("./index.html"))));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    const existing=list.find(c=>c.url.includes("/mama/"));
    if(existing){existing.focus();return existing.navigate("./#window")}
    return clients.openWindow("./#window");
  }));
});
