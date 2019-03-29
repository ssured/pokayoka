import React from 'react'; // tslint:disable-line import-name
import { render } from 'react-dom';

import { App } from './App';

import { configure, autorun } from 'mobx';
import { setLivelynessChecking } from 'mobx-state-tree';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'tailwindcss/css/preflight.css';
import 'leaflet/dist/leaflet.css';

import { IconContext } from 'react-icons';
import { AuthenticationContainer } from './contexts/authentication';
import { MuxContainer } from './contexts/mux';
import { SpotDB } from './utils/spotdb';
import { SPOHub } from './utils/spo-hub';
import { SPOStorage } from './utils/spo-storage';
import { createObservable } from './utils/spo-observable';
import { getSubj, isSPOShape } from './utils/spo';

// fix marker urls
// https://github.com/PaulLeCam/react-leaflet/issues/255#issuecomment-261904061
// const L = require('leaflet');
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: require('leaflet/images/marker-icon-2x.png'),
//   iconUrl: require('leaflet/images/marker-icon.png'),
//   shadowUrl: require('leaflet/images/marker-shadow.png'),
// });

const spotDb = new SpotDB('pokayoka');
// @ts-ignore
window.spot = spotDb;

const hub = new SPOHub();
const storage = new SPOStorage(hub, spotDb);
const observable = createObservable(hub, ['bk0wl6vr9vstorey']).object;

autorun(() => {
  console.log('observable.name', observable.name);
});
setTimeout(
  () =>
    autorun(() => {
      console.log(
        'observable.building',
        getSubj(observable.building as any),
        isSPOShape(observable.building) && observable.building.name
      );
    }),
  1000
);

// @ts-ignore
window.obs = observable;
console.log({ observable });

// @ts-ignore
window.autorun = autorun;

if (
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost')
) {
  // navigator.serviceWorker.register('/sw.bundle.js');
}

const isProduction = false; // FIXME implement this

configure({ enforceActions: 'observed', disableErrorBoundaries: isProduction });
setLivelynessChecking(isProduction ? 'ignore' : 'error');

/**
 * boot the app
 */

const elemDiv = document.createElement('div');
elemDiv.id = 'root';
document.body.appendChild(elemDiv);

function renderApp() {
  render(
    <IconContext.Provider value={{ style: { verticalAlign: 'middle' } }}>
      <AuthenticationContainer.Provider>
        <MuxContainer.Provider>
          <App />
        </MuxContainer.Provider>
      </AuthenticationContainer.Provider>
    </IconContext.Provider>,
    document.getElementById('root')
  );
}

renderApp();

if ((module as any).hot) {
  (module as any).hot.accept('./App', () => {
    renderApp();
  });
}
