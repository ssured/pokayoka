import { useContext } from 'react';
import createContainer from 'constate';
import { useLocalStorage } from 'react-use';

type AuthContextSuccess = {
  ok: true;
  name: string;
  roles: string[];
};

type AuthContextError = {
  ok?: boolean;
  error: string;
  reason: string;
};

type AuthContext = AuthContextSuccess | AuthContextError;

const LocalStorageAuthKey = 'auth';

const isAuthenticated = (context: AuthContext): context is AuthContextSuccess =>
  Boolean(context && context.ok);

export const AuthenticationContainer = createContainer(() => {
  const [authentication, setAuthentication] = useLocalStorage<AuthContext>(
    LocalStorageAuthKey
  );
  const logout = () => {
    setAuthentication({ error: 'logged-out', reason: 'manual logout' });
  };
  return {
    authentication,
    isAuthenticated: isAuthenticated(authentication),
    login: setAuthentication,
    logout,
  };
});

export const useAuthentication = () =>
  useContext(AuthenticationContainer.Context);
