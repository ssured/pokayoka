console.log('serviceworker running');

// precache webpack generated files
// works together with the injectmanifest plugin
// workbox.precaching.precacheAndRoute(self.__precacheManifest || []);

workbox.routing.registerRoute(
  ({ url, event }) => {
    return url.pathname.indexOf('/cdn/') === 0;
  },
  new workbox.strategies.CacheFirst({
    cacheName: 'cdn',
    fetchOptions: {
      credentials: 'include',
    },
  })
);
