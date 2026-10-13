/* 안전보건 스트레칭 캠페인 TV 현황판 — 인터넷이 끊겨도 화면이 열리도록 '화면 파일'만 저장해 두는 파일
   · index.html 과 같은 폴더(저장소 맨 위)에 sw.js 라는 이름으로 올려두면 됩니다.
   · 인터넷이 되면 항상 최신 화면을 받아오고(그래서 index.html 을 고치면 바로 반영),
     4초 안에 못 받아올 때(= 와이파이 끊김)만 마지막으로 저장해 둔 화면을 보여줍니다.
   · 순위 데이터(Cloudflare Worker)는 건드리지 않습니다. */
const CACHE = 'tvboard-shell-v1';

self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function(e){
  const req = e.request;
  if(req.method !== 'GET' || req.mode !== 'navigate') return;   // 화면(문서) 요청만 처리

  e.respondWith((async function(){
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(function(res){
      if(res && res.ok){ cache.put(req, res.clone()).catch(function(){}); }
      return res;
    });
    if(!cached) return net;                       // 처음 방문: 그냥 인터넷으로
    try{
      return await Promise.race([
        net,
        new Promise(function(_, reject){ setTimeout(reject, 4000); })
      ]);
    }catch(err){
      return cached;                              // 끊겼으면 저장해 둔 화면
    }
  })());
});
