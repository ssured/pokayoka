import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { computed } from 'mobx';

import { Popup } from 'react-leaflet';
import DivIcon from 'react-leaflet-div-icon';

import L from 'leaflet';
import { Rectangle, Circle } from 'react-leaflet';
import { Label } from 'semantic-ui-react';

import { colorForStatus } from '../utils/color';

const DocIcon = observer(
  ({ doc, ...props }) => (doc._rev || !!'true') && <DivIcon {...props} />
);

@inject('store')
@observer
class MapDivIcon extends Component {
  @computed
  get doc() {
    const {
      docId,
      store: { data },
    } = this.props;
    return data && data.getDoc(docId, true);
  }

  render() {
    const { doc } = this;
    if (doc == null) return null;

    const { router, data, filter } = this.props.store;
    const { onDocClick = () => {}, children, popup, marker } = this.props;

    if ((doc.childIds && doc.childIds.length > 0) || doc.status == null) {
      const children = filter
        .filter(doc.childIds)
        .map(id => data.getDoc(id, true))
        .filter(doc => doc != null && doc.position != null);

      const positions = [doc.position]
        .concat(children.map(child => child.position))
        .filter(position => position != null);

      if (positions.length === 0) return null;

      if (positions.length === 1) {
        return (
          <DivIcon
            key="label"
            position={positions[0]}
            className="invisible-div-icon"
            onClick={() => router.goTo('map', { docId: doc._id })}
          >
            <Label color="blue">{doc.title}</Label>
          </DivIcon>
        );
      }

      const bounds = L.latLngBounds(positions);

      return [
        <Rectangle key="boundingBox" bounds={bounds} stroke={false} />,
        <DivIcon
          key="label"
          position={bounds.getCenter()}
          className="invisible-div-icon"
          onClick={() => router.goTo('map', { docId: doc._id })}
        >
          <Label color="blue">{doc.title}</Label>
        </DivIcon>,
        children.map(child => (
          <Circle
            key={child._id}
            center={child.position}
            radius={1}
            weight={1}
            color={child.$archived ? '#444' : colorForStatus(child.status)}
            fillColor={child.$archived ? '#444' : colorForStatus(child.status)}
          />
        )),
      ];
      // return doc.childIds.map(id => (
      //   <MapDivIcon key={id} docId={id} {...{ popup, marker }} />
      // ));
    }
    return doc.position ? (
      <DocIcon
        doc={doc}
        position={doc.position}
        className="invisible-div-icon"
        onClick={undefined && onDocClick.bind(this, doc)}
      >
        {typeof popup === 'function' ? <Popup>{popup(doc)}</Popup> : null}
        {children || (typeof marker === 'function' ? marker(doc) : null)}
      </DocIcon>
    ) : null;
  }
}

export default MapDivIcon;
