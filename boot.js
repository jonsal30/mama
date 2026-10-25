document.getElementById("installBtn").onclick=()=>document.getElementById("installModal").classList.add("show");
function closeInstall(){document.getElementById("installModal").classList.remove("show")}
document.getElementById("installModal").onclick=e=>{if(e.target.id==="installModal")closeInstall()};

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
if(typeof initFasting==="function") initFasting();
if(typeof initBackend==="function") initBackend();
applyLang();