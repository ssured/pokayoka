import { Box, Heading, Menu, Text } from 'grommet';
import { Add, Logout, SettingsOption, User } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { router } from '../App';
import { useAuthentication } from '../contexts/authentication';
import { useRoot } from '../contexts/spo-hub';
import { InfoNotification } from '../layout/Notifications';
import { RoutedButton } from '../layout/RoutedButton';
import { TileGrid } from '../layout/TileGrid';
import { Todo } from '../layout/Todo';
import { PageTitle } from '../layout/PageTitle';

const AddProjectButton = () => (
  <RoutedButton
    label={
      <Box justify="center" direction="row" gap="small">
        <Add /> <Text>Voeg project toe</Text>
      </Box>
    }
    to={router.projects.new}
    plain={false}
  />
);

export const Home: React.FunctionComponent<{}> = observer(({}) => {
  const { authentication, logout } = useAuthentication();
  const { projects } = useRoot()();

  const hasProjects = Object.keys(projects).length > 0;

  return (
    <Box fill direction="column" align="center" gap="large">
      <Box>
        {authentication.ok ? (
          <Todo>
            <Box direction="row" gap="medium" align="center">
              <Menu
                label={
                  <Box justify="center" direction="row" gap="small">
                    <User />
                    <Text>{authentication.name}</Text>
                  </Box>
                }
                items={[
                  {
                    icon: <Logout />,
                    label: 'Logout',
                    onClick: () => logout(),
                  },
                ]}
              />
              <RoutedButton
                to={router.account}
                icon={<SettingsOption />}
                label="Instellingen"
                plain={false}
              />
            </Box>
          </Todo>
        ) : (
          <Text>Niet ingelogd</Text>
        )}
      </Box>
      <PageTitle>Projecten [{Object.keys(projects).join('/')}]</PageTitle>

      {hasProjects ? (
        <Todo>
          <TileGrid>
            <Box
              fill
              border
              align="center"
              justify="center"
              direction="row"
              gap="medium"
            >
              <AddProjectButton />
            </Box>
          </TileGrid>
        </Todo>
      ) : (
        <InfoNotification
          message="Geen projecten gevonden"
          action={<AddProjectButton />}
        />
      )}
    </Box>
  );
});
