import React from 'react';
import { Box, Heading } from 'grommet';
import { RouteComponentProps } from '@reach/router';
import { useAccount } from '../../contexts/spo-hub';
import { useObserver, observer } from 'mobx-react-lite';
import { ProjectTile } from '../../model/Project/ProjectTile';
import { ProjectFormCreate } from '../../model/Project/ProjectFormCreate';

export const List: React.SFC<RouteComponentProps<{}>> = observer(({}) => {
  return useObserver(() => {
    const account = useAccount();
    return (
      <>
        <Heading level="3">Projecten</Heading>
        {account.fold(
          account => (
            <>
              <Box
                direction="row-responsive"
                justify="center"
                align="center"
                pad="medium"
                gap="medium"
              >
                {[...account.projects.entries()].map(([key, project]) =>
                  project.fold(
                    project => (
                      <ProjectTile
                        key={key}
                        project={[project, ['projects', key]]}
                      />
                    ),
                    project => <div key={key}>Loading {project.name || ''}</div>
                  )
                )}
              </Box>
              <ProjectFormCreate
                onSubmit={async project => {
                  account.addProject(project);
                }}
              />
            </>
          ),
          account => (
            <>Account is aan het synchroniseren</>
          )
        )}
      </>
    );
  });
});
