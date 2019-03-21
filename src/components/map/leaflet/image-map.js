import React, { createRef, Component } from 'react';
import L from 'leaflet';
import { Map } from 'react-leaflet';
import { observer } from 'mobx-react';

/* Sample implementation:
<div className="aspect-1-1" style={{ width: '90%' }}>
  <PDFMap
    center={[-256,256]} 
    zoom={1} 
    className="spread"
  >
    <TileImage
      url={url}
    />

    { doc.$children
      .filter((child) => !!child.data.position)
      .map((child) => 
      <Marker key={child.id} 
        position={child.data.position}
        onClick={() => api.select(child)}
      />
    )}
  </PDFMap>
</div>
*/

class PDFMap extends Component {
  mapRef = createRef();

  componentDidMount() {
    const { onRef } = this.props;
    if (typeof onRef === 'function') {
      onRef(this.mapRef.current);
    }
  }

  render() {
    const { children, ...mapOptions } = this.props;
    return (
      <Map
        crs={L.CRS.Simple}
        fadeAnimation={false}
        attributionControl={false}
        zoomSnap={1 / 2}
        center={[-256, 256]}
        zoom={0}
        zoomControl={false}
        ref={this.mapRef}
        {...mapOptions}
        style={{ flex: '1 1 auto' }}
      >
        {children}
      </Map>
    );
  }
}

export default observer(PDFMap);
