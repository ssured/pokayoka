import { createContext, useContext } from 'react';
import createContainer from 'constate';
import { useLocalStorage } from 'react-use';

type AuthContextValue = {
  email: string;
  token: string;
  expires: string;
};

const LocalStorageAuthKey = 'auth';

export const AuthenticationContainer = createContainer(() => {
  const [authentication, setAuthentication] = useLocalStorage<AuthContextValue>(
    LocalStorageAuthKey
  );
  return { authentication, setAuthentication };
});

export const useAuthentication = () =>
  useContext(AuthenticationContainer.Context);

export const useToken = () => {
  const { authentication } = useAuthentication();
  if (!authentication || !authentication.token) {
    throw new Error('token is not defined, user is not logged in');
  }
  if (new Date() < new Date(authentication.expires)) {
    throw new Error('token expired');
  }
  return authentication.token;
};
