import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import { Grommet } from 'grommet';
import 'leaflet/dist/leaflet.css';
import { configure } from 'mobx';
import React from 'react'; // tslint:disable-line import-name
import { render } from 'react-dom';
import { IconContext } from 'react-icons';
import { App } from './App';
import { AuthenticationContainer } from './contexts/authentication';
import { theme } from './theme';

// fix marker urls
// https://github.com/PaulLeCam/react-leaflet/issues/255#issuecomment-261904061
const L = require('leaflet');
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('./marker-icon-2x.png'),
  iconUrl: require('./marker-icon.png'),
  shadowUrl: require('./marker-shadow.png'),
});

if (
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost')
) {
  navigator.serviceWorker.register('/sw.bundle.js');
}

const isProduction = false; // FIXME implement this

configure({ enforceActions: 'observed', disableErrorBoundaries: isProduction });

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
        <Grommet theme={theme} full>
          <App />
        </Grommet>
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
