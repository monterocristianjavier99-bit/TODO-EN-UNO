const CACHE='todo-en-uno-v62';
const SHELL=['./','./index.html','./version.json'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(SHELL))
      .catch(()=>{})
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;

  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  if(
    req.mode==='navigate' ||
    url.pathname.endsWith('/version.json') ||
    url.pathname.endsWith('/index.html')
  ){
    event.respondWith(
      fetch(new Request(req,{cache:'no-store'}))
        .then(res=>{
          if(req.mode==='navigate' || url.pathname.endsWith('/index.html')){
            const copy=res.clone();
            caches.open(CACHE)
              .then(c=>c.put('./index.html',copy))
              .catch(()=>{});
          }
          return res;
        })
        .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        if(res.ok){
          caches.open(CACHE)
            .then(c=>c.put(req,res.clone()))
            .catch(()=>{});
        }
        return res;
      });
    })
  );
});
