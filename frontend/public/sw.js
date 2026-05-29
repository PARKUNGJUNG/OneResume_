// OneResume Service Worker: Network-First Strategy
const CACHE_NAME = 'oneresume-cache-v2'; // 버전을 올려서 기존 캐시 강제 갱신
const urlsToCache = [
  '/',
  '/index.html',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json'
];

// 설치 단계: 기본 리소스 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // 즉시 활성화
  );
});

// 활성화 단계: 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// 페치 단계: Network-First 전략 (흰 화면 방지의 핵심)
self.addEventListener('fetch', (event) => {
  // HTML 요청이나 API 요청 등은 항상 최신 상태를 유지해야 함
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 서버 응답이 성공적이면 캐시에 복사본 저장 후 반환
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 연결 실패 시에만 캐시에서 찾아서 반환
        return caches.match(event.request);
      })
  );
});
