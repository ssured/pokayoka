import L from 'leaflet';
import { TileLayer, GridLayer, withLeaflet } from 'react-leaflet';
import PropTypes from 'prop-types';

import './add/tile-image';

class TileImage extends GridLayer {
  createLeafletElement(props) {
    const {
      url = null,
      width = 1024,
      height = 1024,
      availableZoomLevels = null,
      urlForXYZ = () => {},
      ...options
    } = props;
    // @ts-ignore
    return new L.TileLayer.TileImage(
      {
        width,
        height,
        availableZoomLevels,
        url: Promise.resolve(url),
        urlForXYZ,
      },
      this.getOptions(options)
    );
  }

  updateLeafletElement(fromProps, toProps) {
    // if (toProps.url !== fromProps.url) {
    //   this.leafletElement.setUrl(toProps.url)
    // }
  }
}

TileImage.propTypes = {
  // ...TileLayer.propTypes,
  continuousWorld: PropTypes.bool,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
};
// delete TileImage.url; // is not needed

TileImage.defaultProps = {
  ...(TileLayer.defaultProps || {}),
  continuousWorld: true,
  minZoom: 0,
  maxZoom: 7,
};

export default withLeaflet(TileImage);
