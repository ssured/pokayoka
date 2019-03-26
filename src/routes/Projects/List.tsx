import React from 'react';
import { IObservation } from '../../models/Observation';
import { Heading } from 'grommet';
import { RouteComponentProps } from '@reach/router';
import { useAuthentication } from '../../contexts/authentication';
import { Box, Grid, Menu } from 'grommet';
import { RouteLink } from '../../components/ui/RouteLink';

export const List: React.SFC<
  RouteComponentProps<{ observation: IObservation }>
> = ({ observation }) => {
  const { authentication, dbNames, logout } = useAuthentication();
  return (
    <>
      <Heading level="3">Projecten</Heading>
      {authentication.ok
        ? [...dbNames].map(db => (
            <RouteLink key={db} href={`projects/${db}`} label={db} />
          ))
        : 'Please connect to server to see your databases'}
    </>
  );
};
