import React from 'react'; // tslint:disable-line import-name
import { render } from 'react-dom';

import { App } from './App';

import { configure } from 'mobx';
import { setLivelynessChecking } from 'mobx-state-tree';

import { startClient } from './utils/mux';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'tailwindcss/css/preflight.css';

import { IconContext } from 'react-icons';
import { AuthenticationContainer } from './contexts/authentication';

const isProduction = false; // FIXME implement this
configure({ enforceActions: 'always', disableErrorBoundaries: isProduction });
setLivelynessChecking(isProduction ? 'ignore' : 'error');

// onSnapshot(store, snapshot => console.log('STORE', snapshot));
// autorun(() =>
//   console.log(
//     'STORE',
//     [...store.shared.values()].map(val => [getType(val).name, getSnapshot(val)])
//   )
// );

// {
//   const ws = new WebSocket('ws://localhost:3000/debug');
//   const { object, updateObject } = objectFromPatchStream();
//   ws.addEventListener('message', ({ data }) => {
//     updateObject(JSON.parse(data));
//     console.debug('SERVER DEBUG', object());
//   });
// }

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

startClient();
