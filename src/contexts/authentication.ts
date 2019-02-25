import { useContext } from 'react';
import createContainer from 'constate';
import { useLocalStorage } from 'react-use';

export type AuthenticationContextSuccess = {
  ok: true;
  name: string;
  roles: string[];
};

export type AuthenticationContextError = {
  ok: false | undefined;
  error: string;
  reason: string;
};

export type AuthenticationContext =
  | AuthenticationContextSuccess
  | AuthenticationContextError;

const LocalStorageAuthKey = 'auth';

const isAuthenticated = (
  context: AuthenticationContext
): context is AuthenticationContextSuccess => Boolean(context && context.ok);

export const AuthenticationContainer = createContainer(() => {
  const [authentication, setAuthentication] = useLocalStorage<
    AuthenticationContext
  >(LocalStorageAuthKey);
  const logout = () => {
    setAuthentication({
      ok: false,
      error: 'logged-out',
      reason: 'manual logout',
    });
  };
  return {
    authentication,
    dbNames:
      (authentication &&
        authentication.ok &&
        authentication.roles.reduce((dbNames, role) => {
          dbNames.add(role.split('-').pop()!);
          return dbNames;
        }, new Set<string>())) ||
      new Set<string>(),
    isAuthenticated: isAuthenticated(authentication),
    login: setAuthentication,
    logout,
  };
});

export const useAuthentication = () =>
  useContext(AuthenticationContainer.Context);
