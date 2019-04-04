import React from 'react';
import { Box, Heading } from 'grommet';
import { RouteComponentProps } from '@reach/router';
import { useAccount } from '../../contexts/spo-hub';
import { useObserver } from 'mobx-react-lite';
import { ProjectTile } from '../../SPO/model/Project/ProjectTile';

export const List: React.SFC<RouteComponentProps<{}>> = ({}) => {
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
          gap="medium"
        >
          {account != null
            ? [...account.projects.entries()].map(([key, project]) =>
                project.fold(
                  project => (
                    <ProjectTile
                      key={key}
                      project={[project, ['projects', key]]}
                    />
                  ),
                  project => <div key={key}>Loading {project.name || ''}</div>
                )
              )
            : 'Account is aan het synchroniseren'}
        </Box>
      </>
    );
  });
};
