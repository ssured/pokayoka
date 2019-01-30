import React from 'react'; // tslint:disable-line import-name
import { render } from 'react-dom';

import { App } from './App';
import { Store, StoreContext, rootEnv } from './store';

import { client } from './worker/client';
import { ensureNever } from './utils';
import { AskMessageType, TellMessageType } from '../server/protocolv1';
import { configure } from 'mobx';
import { setLivelynessChecking } from 'mobx-state-tree';

import { startClient } from './utils/mux';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'tailwindcss/css/preflight.css';

import { IconContext } from 'react-icons';
import { GlobalStyles } from './GlobalStyles';

const isProduction = false; // FIXME implement this
configure({ enforceActions: 'always', disableErrorBoundaries: isProduction });
setLivelynessChecking(isProduction ? 'ignore' : 'error');

client.subscribe(message => {
  console.log(`client received <--`, message);
  switch (message.type) {
    case AskMessageType:
      break;
    case TellMessageType:
      if (store.shared.has(message.doc._id)) {
        store.shared.get(message.doc._id)!.merge(message.doc);
      } else {
        store.add(message.doc as any);
      }
      break;
    default:
      ensureNever(message, false);
  }
});

const store = Store.create(
  {
    shared: {
      // [_id]: {
      //   _id,
      //   type: 'project',
      //   name: 'TestProject',
      // },
    },
  },
  {
    ...rootEnv,
  }
);

store.requests.subscribe(request => {
  if (request.type === 'fetch') {
    client.fire({ type: AskMessageType, id: request.id });
  }
});
store.snapshots.subscribe((mapName, doc) => {
  console.log('store.snapshots fired', doc);
  client.fire({ doc, type: TellMessageType });
});

setTimeout(() => {
  console.log('getting data from store');
  store.findOrFetch('cisvmclrpxin');
}, 10);

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
      <StoreContext.Provider value={store}>
        <GlobalStyles />
        <App />
      </StoreContext.Provider>
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
