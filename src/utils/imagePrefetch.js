const cachedImages = new Set();
const inFlight = new Map();
const queue = [];

const MAX_CONCURRENT = 3;
let activeCount = 0;

function pumpQueue() {
  while (activeCount < MAX_CONCURRENT && queue.length > 0) {
    const task = queue.shift();
    if (!task) return;

    activeCount += 1;
    task()
      .catch(() => undefined)
      .finally(() => {
        activeCount -= 1;
        pumpQueue();
      });
  }
}

export function markImageCached(src) {
  if (!src) return;
  cachedImages.add(src);
}

export function isImageCached(src) {
  return !!src && cachedImages.has(src);
}

export function preloadImage(src) {
  if (!src) return Promise.resolve(false);
  if (isImageCached(src)) return Promise.resolve(true);
  if (inFlight.has(src)) return inFlight.get(src);

  const promise = new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      markImageCached(src);
      resolve(true);
    };

    img.onerror = () => {
      resolve(false);
    };

    img.src = src;
  }).finally(() => {
    inFlight.delete(src);
  });

  inFlight.set(src, promise);
  return promise;
}

export function warmImages(urls, limit = 18) {
  if (!Array.isArray(urls) || urls.length === 0) return;

  const uniqueTargets = [...new Set(urls)]
    .filter((src) => src && !isImageCached(src))
    .slice(0, limit);

  uniqueTargets.forEach((src) => {
    queue.push(() => preloadImage(src));
  });

  pumpQueue();
}
