import { Route } from 'boring-router-react';
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { router } from '../../../../router';
import { Maybe } from '../../../../utils/universe';
import { PProjectContext } from '../Detail';
import { List } from './List';
import { New } from './New';
import { PageTitle } from '../../../../components/Page/Page';
import { useRoot } from '../../../../contexts/spo-hub';
import { isPPerson } from '../../../../model/Person';
import { Text } from 'grommet';

const currentRoute = router.projects.projectId.snags;

export const Snags: React.FunctionComponent<{
  project?: Maybe<PProject>;
}> = observer(({ project = useContext(PProjectContext) }) => {
  const userPerson = useRoot()().is;
  return (
    <>
      <Route match={currentRoute} exact>
        <List />
      </Route>

      <Route match={currentRoute.new} exact>
        <PageTitle title={[['Nieuwe bevinding']]}>
          {isPPerson(userPerson) || true ? (
            <New
              accountable={userPerson}
              onSubmit={async task => {
                console.log('task', task);
                currentRoute.$replace();
              }}
            />
          ) : (
            <Text>Not ready</Text>
          )}
        </PageTitle>
      </Route>
    </>
  );
});
