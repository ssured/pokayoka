import React from 'react';
import { Box, Heading, Image, Button } from 'grommet';
import { RouteComponentProps, navigate } from '@reach/router';
import { useAccount, useRoot } from '../../contexts/spo-hub';
import { useObserver, observer } from 'mobx-react-lite';
import { ProjectTile } from '../../model/Project/ProjectTile';
import { ProjectFormCreate } from '../../model/Project/ProjectFormCreate';
import { toJS } from 'mobx';

export const List: React.SFC<RouteComponentProps<{}>> = observer(({}) => {
  const root = useRoot();

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
              wrap
            >
              {[...Object.entries(root.projects)]
                .filter(([_, project]) => project && project.name)
                .map(
                  ([key, project]) =>
                    project && (
                      <Box
                        key={key}
                        width="small"
                        height="small"
                        border
                        align="center"
                      >
                        {project.$image && (
                          <Image src={`/cdn/${project.$image}`} fit="contain" />
                        )}
                        <Heading level="3">{project.name}</Heading>
                        <Button
                          onClick={() => navigate(`/columns/${project.code}`)}
                          label="Open"
                        />
                      </Box>
                    )
                )}
              {/* {[...account.projects.entries()].map(([key, project]) =>
                project.fold(
                  project => (
                    <ProjectTile
                      key={key}
                      project={[project, ['projects', key]]}
                    />
                  ),
                  project => <div key={key}>Loading {project.name || ''} </div>
                )
              )} */}
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
