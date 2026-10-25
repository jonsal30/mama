const CACHE="health-ally-v5-push-sync";
const ASSETS=["./","./index.html","./styles.css","./data.js","./ui.js","./logs.js","./reminders.js","./backend.js","./fasting.js","./boot.js","./manifest.webmanifest","./app-icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
  }).catch(()=>caches.match("./index.html"))));
});

self.addEventListener("push",e=>{
  let data={};
  try{data=e.data?e.data.json():{}}catch(_){try{data={body:e.data.text()}}catch(__){}}
  const title=data.title||"Health Ally";
  const options={
    body:data.body||"Tienes un aviso importante.",
    icon:"./icon.png",badge:"./icon.png",tag:data.tag||"health-ally-push",
    renotify:true,requireInteraction:true,
    data:{url:data.url||"./#window",jobKey:data.jobKey||"",kind:data.kind||""}
  };
  e.waitUntil(Promise.all([
    self.registration.showNotification(title,options),
    self.navigator&&self.navigator.setAppBadge?self.navigator.setAppBadge(1).catch(()=>{}):Promise.resolve()
  ]));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  const d=e.notification.data||{},url=d.url||"./#window";
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(async list=>{
    const existing=list.find(c=>c.url.includes("/mama/"));
    if(existing){await existing.focus(); if(existing.navigate)await existing.navigate(url); try{existing.postMessage({type:"health-ally-push",jobKey:d.jobKey,kind:d.kind})}catch(_){ } return existing}
    return clients.openWindow(url);
  }));
});
