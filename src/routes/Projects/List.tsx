import React from 'react';
import { IObservation } from '../../models/Observation';
import { Heading } from 'grommet';
import { RouteComponentProps } from '@reach/router';
import { useAuthentication } from '../../contexts/authentication';
import { Box, Grid, Menu } from 'grommet';
import { RouteLink } from '../../components/ui/RouteLink';
import { useQuery } from '../../contexts/store';
import { projectType } from '../../models/Project';

const LoadingIndicator = () => <p>Loading...</p>;
const ErrorMessage = (error: Error) => (
  <h3>Uh oh, something happened {error.message}</h3>
);

export const List: React.SFC<
  RouteComponentProps<{ observation: IObservation }>
> = ({ observation }) => {
  const { authentication, dbNames, logout } = useAuthentication();

  // const query = useQuery<{ projectId: [string] }>(
  //   v => [{ s: v('projectId'), p: 'type', o: projectType }],
  //   []
  // );

  return (
    <>
      <Heading level="3">Projecten</Heading>
      {authentication.ok
        ? [...dbNames].map(db => (
            <RouteLink key={db} href={`projects/${db}`} label={db} />
          ))
        : 'Please connect to server to see your databases'}

      {/*query.fold(
        LoadingIndicator,
        results => (
          <>
            <ul>
              {results.map(r => (
                <li key={r.projectId[0]}>{r.projectId[0]}</li>
              ))}
            </ul>
          </>
        ),
        ErrorMessage
              )*/}
    </>
  );
};
