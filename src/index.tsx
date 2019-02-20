import React from 'react'; // tslint:disable-line import-name
import { render } from 'react-dom';

import { App } from './App';

import { configure } from 'mobx';
import { setLivelynessChecking } from 'mobx-state-tree';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'tailwindcss/css/preflight.css';

import { IconContext } from 'react-icons';
import { AuthenticationContainer } from './contexts/authentication';

import { startMux } from './mux';

if (
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost')
) {
  // navigator.serviceWorker.register('/sw.bundle.js');
}

const isProduction = false; // FIXME implement this

configure({ enforceActions: 'always', disableErrorBoundaries: isProduction });
setLivelynessChecking(isProduction ? 'ignore' : 'error');

startMux();

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
        <App />
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
