import React from 'react';
import { Router } from '@reach/router';

import { Home } from './routes/Home';
import { User } from './routes/User';
import { Project } from './routes/Project';
import { Debug } from './routes/Debug';
import { Guide } from './routes/Guide';
import { MainMenu } from './components/MainMenu';
import { CapabilitiesCheck } from './components/CapabilitiesCheck';
import { FrontGate } from './components/FrontGate';

type Props = {};

export const App: React.SFC<Props> = ({}) => (
  <CapabilitiesCheck>
    <FrontGate>
      <MainMenu>
        <Router>
          <Home path="/" />
          <Debug path="debug" />
          <Guide path="guide" />
          <User path=":userId" />

          {/* <User path=":userId">
      <Project path=":projectId" />
    </User> */}
        </Router>
      </MainMenu>
    </FrontGate>
  </CapabilitiesCheck>
);
