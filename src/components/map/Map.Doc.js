import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import L from 'leaflet';

import ImageMap from './leaflet/image-map';

const getPrefix = doc => `__snag_${doc._id}`;
const getMapBoundsKey = doc => `${getPrefix(doc)}_mapbounds`;
const getMapZoomKey = doc => `${getPrefix(doc)}_mapzoom`;

const setBounds = (doc, bounds) =>
  localStorage.setItem(getMapBoundsKey(doc), bounds.toBBoxString());
const getBounds = doc => {
  const bBoxString = localStorage.getItem(getMapBoundsKey(doc));
  return bBoxString ? L.latLngBounds.fromBBoxString(bBoxString) : null;
};

const setZoom = (doc, zoom) => localStorage.setItem(getMapZoomKey(doc), zoom);
const getZoom = doc =>
  parseInt(localStorage.getItem(getMapZoomKey(doc)) || 0, 10);

class MapDoc extends Component {
  render() {
    const { doc, children, ...mapOptions } = this.props;

    if (doc == null || doc.images.length === 0) return null;
    return (
      <ImageMap
        image={doc.images[0]}
        onMoveend={({ target }) => {
          setBounds(doc, target.getBounds());
          setZoom(doc, target.getZoom());
        }}
        center={getBounds(doc) ? getBounds(doc).getCenter() : [-256, 256]}
        zoom={getZoom(doc) || 0}
        {...mapOptions}
      >
        {children}
      </ImageMap>
    );
  }
}

export default observer(MapDoc);
