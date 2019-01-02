import React from 'react';
import { Router } from '@reach/router';

import { Home } from './routes/Home';
import { User } from './routes/User';
import { Project } from './routes/Project';
import { Debug } from './routes/Debug';
import { Nlsfb } from './routes/Nlsfb';
import { NlsfbElement } from './routes/NlsfbElement';

type Props = {};

export const App: React.SFC<Props> = ({}) => (
  <Router>
    <Home path="/" />
    <Debug path="debug" />
    <Nlsfb path="nlsfb">
      <NlsfbElement path=":elementId" />
    </Nlsfb>
    {/* <User path=":userId">
      <Project path=":projectId" />
    </User> */}
  </Router>
);
