import React from 'react';
import { IObservation } from '../../models/Observation';
import { Heading, Text, Image } from 'grommet';
import { RouteComponentProps } from '@reach/router';
import { useAuthentication } from '../../contexts/authentication';
import { Box, Grid, Menu } from 'grommet';
import { RouteLink, RouteButton } from '../../components/ui/RouteLink';
import { useAccount } from '../../contexts/spo-hub';
import { useObserver } from 'mobx-react-lite';

export const List: React.SFC<
  RouteComponentProps<{ observation: IObservation }>
> = ({ observation }) => {
  const { authentication, dbNames, logout } = useAuthentication();
  const maybeAccount = useAccount();
  return useObserver(() => {
    const { value: account } = maybeAccount;
    return (
      <>
        <Heading level="3">Projecten</Heading>
        <Box
          direction="row-responsive"
          justify="center"
          align="center"
          pad="medium"
          // background="dark-2"
          gap="medium"
        >
          {account != null
            ? [...account.projects.entries()].map(
                ([key, { value: project }]) =>
                  project && (
                    <Box
                      key={key}
                      pad="large"
                      align="center"
                      width="medium"
                      height="medium"
                      margin="medium"
                      border
                      round
                      gap="small"
                    >
                      <Box height="small" width="small" border>
                        <Image
                          src="//v2.grommet.io/assets/IMG_4245.jpg"
                          fit="cover"
                        />
                      </Box>
                      <Heading level="3">{project.name}</Heading>
                      <RouteButton
                        href={`projects/${key}`}
                        label={'Open project'}
                      />
                    </Box>
                  )
              )
            : 'Account is aan het synchroniseren'}
        </Box>
      </>
    );
  });
};
