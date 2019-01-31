import { useToken } from '../contexts/authentication';
import { useAsync } from 'react-use';
import axios from 'axios';
import { ServerAPIGet_Account_Response } from '../../server/auth';

export const useAccount = () => {
  const token = useToken();
  return useAsync<ServerAPIGet_Account_Response>(
    () =>
      axios
        .create({
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .get('/auth/account')
        .then(({ data }) => data),
    [token]
  );
};
