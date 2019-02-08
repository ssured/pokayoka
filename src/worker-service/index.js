// precache webpack generated files
// works together with the injectmanifest plugin
workbox.precaching.precacheAndRoute(self.__precacheManifest || []);

workbox.routing.registerRoute(
  ({ url, event }) => {
    return url.pathname.indexOf('.') === -1 && url.search.indexOf('rev') > -1;
  },
  workbox.strategies.cacheFirst({
    cacheName: 'couchdb-attachment',
  })
);
