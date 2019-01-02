import React from 'react';
import { Router } from '@reach/router';

import { Home } from './routes/Home';
import { User } from './routes/User';
import { Project } from './routes/Project';
import { Debug } from './routes/Debug';

type Props = {};

export const App: React.SFC<Props> = ({}) => (
  <Router>
    <Home path="/" />
    <Debug path="debug" />

    {/* <User path=":userId">
      <Project path=":projectId" />
    </User> */}
  </Router>
);
