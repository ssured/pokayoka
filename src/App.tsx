import React from 'react';
import { Router } from '@reach/router';

import { Home } from './routes/Home';
import { User } from './routes/User';
import { Debug } from './routes/Debug';
import { Guide } from './routes/Guide';
import { MainMenu } from './components/MainMenu';
import { CapabilitiesCheck } from './components/CapabilitiesCheck';
import { LoginForm } from './components/LoginForm/index';
import { useAuthentication } from './contexts/index';

type Props = {};

const IfAuthenticated: React.FunctionComponent<{}> = ({ children }) => {
  const { authentication } = useAuthentication();
  return !!authentication ? <>{children}</> : null;
};

const IfAnonymous: React.FunctionComponent<{}> = ({ children }) => {
  const { authentication } = useAuthentication();
  return !!authentication ? null : <>{children}</>;
};

export const App: React.SFC<Props> = ({}) => {
  const { isAuthenticated, login } = useAuthentication();
  return (
    <CapabilitiesCheck>
      {!isAuthenticated && (
        <LoginForm
          onAuthentication={(email, token, expires) =>
            login({ email, token, expires })
          }
        />
      )}

      {isAuthenticated && (
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
      )}
    </CapabilitiesCheck>
  );
};
