console.log('serviceworker running');

// precache webpack generated files
// works together with the injectmanifest plugin
workbox.precaching.precacheAndRoute(self.__precacheManifest || []);

workbox.routing.registerRoute(
  ({ url, event }) => {
    console.log('TODO check for pathname starting with /db', url.pathname);
    return url.pathname.indexOf('.') === -1 && url.search.indexOf('rev') > -1;
  },
  workbox.strategies.cacheFirst({
    cacheName: 'couchdb-attachments',
    fetchOptions: {
      credentials: 'include',
    },
  })
);

/*
elke file in eigen document
sync geen probleem, want op basis van state


_id = uniek, eventueel de MD5 van de file
_attachments {
    data: {
        content_type: ...
        digest: ...
    }
}

link is dan GET {db}/{_id}/data




*/
