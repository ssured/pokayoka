import L from 'leaflet';

// missing inverse of L.LatLngBounds.toBBoxString
L.latLngBounds.fromBBoxString =
  L.latLngBounds.fromBBoxString ||
  function(bbox) {
    var [west, south, east, north] = bbox.split(',').map(parseFloat);
    return new L.LatLngBounds(
      new L.LatLng(south, west),
      new L.LatLng(north, east)
    );
  };

var TILESIZE = 512;
// L.TileLayer.TileImage is a class that you can use to display large images in Leaflet
// tiling is based on CSS, which makes it super fast on (most) mobile devices
//
// Relies on css backgroundSize property:
// http://caniuse.com/background-img-opts tldr: IE9+ or any other browser
L.TileLayer.TileImage =
  L.TileLayer.TileImage ||
  L.GridLayer.extend({
    _image: null,

    setTilingResource: function(tilingResource) {
      this.tilingResource = tilingResource;
      this.redraw();
    },

    initialize: function(tilingResource, options) {
      this.tilingResource = tilingResource;
      options.tileSize = TILESIZE;
      options = L.setOptions(this, options);
    },

    createTile: function(tilePoint, done) {
      let tileElement = L.DomUtil.create('div', 'leaflet-tile');
      let style = tileElement.style;

      let zoom = tilePoint.z;

      var resource = this.tilingResource;
      if (!resource) {
        return;
      }

      var { width, height, availableZoomLevels } = resource;
      var tileWidth,
        tileHeight,
        tileSizeDiff,
        tileZoom,
        backgroundImagePromise,
        factor,
        tileX,
        tileY;

      var isMap =
        Array.isArray(availableZoomLevels) && availableZoomLevels.length > 0;

      if (isMap) {
        tileWidth = tileHeight = TILESIZE;
        tileSizeDiff = Math.min.apply(null, availableZoomLevels); // Math.round((Math.log(1024)-Math.log(TILESIZE))/Math.LN2)
        tileZoom = Math.max.apply(
          null,
          availableZoomLevels
            .filter(function(z) {
              return 0 <= zoom + tileSizeDiff - z;
            })
            .concat(tileSizeDiff)
        );

        factor = 1 << (zoom + tileSizeDiff - tileZoom); // zoom difference factor

        tileX = Math.floor(tilePoint.x / factor);
        tileY = Math.floor(tilePoint.y / factor);

        // transparent pixel
        var url =
          resource.urlForXYZ(tileX, tileY, tileZoom) ||
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
        style.width = `${TILESIZE}px`;
        style.height = `${TILESIZE}px`;
        style.backgroundRepeat = 'no-repeat';
        style.backgroundSize =
          tileWidth * factor + 'px ' + tileHeight * factor + 'px';
        style.backgroundPosition =
          '-' +
          (tilePoint.x % factor) * TILESIZE +
          'px -' +
          (tilePoint.y % factor) * TILESIZE +
          'px';
        style.visibility = 'visible';
        style.backgroundImage = `url(${url})`;

        // backgroundImagePromise = urlPromise.then(function(url) {
        //   return ((url || '') + '').length === 0 ? 'none' : `url(${url})`;
        // });
      } else {
        // it is a single photo
        tileWidth = width;
        tileHeight = height;
        availableZoomLevels = [
          Math.max(
            0,
            Math.ceil(Math.log(Math.max(width, height)) / Math.LN2) - 9
          ),
        ]; // 9 => 2^9 = TILESIZE

        factor = (TILESIZE << zoom) / Math.max(tileWidth, tileHeight);

        if (
          Math.min(tilePoint.x, tilePoint.y) < 0 ||
          Math.max(tilePoint.x, tilePoint.y) >= 1 << zoom
        ) {
          style.display = 'none';
        } else {
          style.width = `${TILESIZE}px`;
          style.height = `${TILESIZE}px`;
          style.backgroundRepeat = 'no-repeat';
          style.backgroundSize =
            tileWidth * factor + 'px ' + tileHeight * factor + 'px';
          style.backgroundPosition =
            '-' +
            tilePoint.x * TILESIZE +
            'px -' +
            tilePoint.y * TILESIZE +
            'px';
          style.backgroundImage = 'none';
          backgroundImagePromise = Promise.resolve(resource.url).then(url =>
            ((url || '') + '').length === 0 ? 'none' : `url(${url})`
          );
        }
      }

      if (backgroundImagePromise) {
        backgroundImagePromise.then(function(backgroundImage) {
          style.backgroundImage = backgroundImage;
          done(null, tileElement);
        });
      } else {
        done(null, tileElement);
      }

      return tileElement;
    },
  });

L.tileLayer.tileImage =
  L.tileLayer.tileImage ||
  function(imageUrl, options) {
    return new L.TileLayer.TileImage(imageUrl, options);
  };
