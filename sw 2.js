/* ナイター馬主記 サービスワーカー(バージョン 20261010163824)
   ・ゲーム本体とアイコンを端末に保存して、電波がなくても起動できるようにする
   ・ネットにつながっているときは最新版を取りにいき、次回起動時から新しい版になる */
const CACHE='naita-bashuki-20261010163824';
const CORE=['./','./index.html','./manifest.webmanifest',"apple-touch-icon.png", "favicon-32.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('naita-bashuki-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  // ゲーム本体:ネット優先(つながらなければ保存済みの版)
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return r;})
      .catch(()=>caches.match('./index.html').then(r=>r||caches.match('./'))));
    return;
  }
  // フォント(Google Fonts)など:保存済みがあればそれを使い、裏で更新
  if(url.origin!==location.origin){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(hit=>{
      const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r;}).catch(()=>hit);
      return hit||net;
    })));
    return;
  }
  // アイコン・起動画面などの同じサイトのファイル:保存済み優先
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));}return r;})));
});
