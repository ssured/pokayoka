import { useAuthentication } from './authentication';
import { startClient } from '../utils/mux';
import { useEffect, useState } from 'react';
import { Source } from 'pull-stream';
import { DatabaseChangesParams, DatabaseChangesResultItem } from 'nano';

type ClientApi = {
  changesSince(
    name: string,
    options: DatabaseChangesParams
  ): Source<DatabaseChangesResultItem>;
};

export const useMux = () => {
  const { authentication } = useAuthentication();
  const [api, setApi] = useState<ClientApi | null>(null);

  useEffect(() => {
    setApi(startClient());
  }, [authentication.ok && authentication.name]);

  return api;
};
