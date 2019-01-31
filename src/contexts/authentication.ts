import { useContext } from 'react';
import createContainer from 'constate';
import { useLocalStorage } from 'react-use';

type AuthContextValue = {
  email: string;
  token: string;
  expires: string;
};

const LocalStorageAuthKey = 'auth';
const LocalStorageDbPrefix = 'db-';

export const AuthenticationContainer = createContainer(() => {
  const [authentication, setAuthentication] = useLocalStorage<AuthContextValue>(
    LocalStorageAuthKey
  );
  const isAuthenticated =
    authentication &&
    !!authentication.token &&
    new Date() < new Date(authentication.expires);
  const logout = () => {
    setAuthentication((undefined as unknown) as AuthContextValue);
  };
  return { authentication, isAuthenticated, login: setAuthentication, logout };
});

export const useAuthentication = () =>
  useContext(AuthenticationContainer.Context);

export const useToken = () => {
  const { isAuthenticated, authentication } = useAuthentication();
  if (!isAuthenticated) {
    throw new Error('not authenticated');
  }
  return authentication.token;
};
