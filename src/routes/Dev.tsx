import { Box, Button, Text, TextInput } from 'grommet';
import { Add, Close } from 'grommet-icons';
import { action, observable, runInAction } from 'mobx';
import { observer, useObservable } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import {
  createEmittingRoot,
  getObservedKeys,
  RootEventMsg,
} from '../utils/observable-root';
import { SPOShape } from '../utils/spo';
import { NProject, NUser, getNUser, getDoc } from '../utils/couchdb-doc';
import { deserialize } from 'serializr';
import { FunctionC } from 'io-ts';
import { projectRelations } from '../model/Project/model';

const Part: React.FunctionComponent<{
  object: SPOShape;
  recurseDepth?: number;
}> = observer(({ object, recurseDepth = 0 }) => {
  const open = useObservable(new Set<string>());

  const toggleKey = (key: string) =>
    runInAction(() => {
      if (open.has(key)) {
        open.delete(key);
      } else {
        open.add(key);
      }
    });

  return (
    <Box direction="column">
      {Object.entries(object).map(([key, value]) => {
        const keyIsOpen = open.has(key);
        const valueIsObject =
          value != null && typeof value === 'object' && !Array.isArray(value);

        return (
          <Box key={key} direction="row" gap="medium">
            {valueIsObject ? (
              <Button
                onClick={() => toggleKey(key)}
                active={keyIsOpen}
                label={key}
              />
            ) : (
              <Text>{key}</Text>
            )}
            <Box>
              {valueIsObject ? (
                recurseDepth > 0 || keyIsOpen ? (
                  <Part
                    object={value as SPOShape}
                    recurseDepth={keyIsOpen ? recurseDepth : recurseDepth - 1}
                  />
                ) : (
                  ''
                )
              ) : (
                JSON.stringify(value)
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
});

const source = observable.map<string, string>();
const { root, subscribe } = createEmittingRoot<string>({
  source,
  onSet: (key, value) => source.set(key, value),
  onRootSet: (key, value) => true,
});

const events = observable.array<RootEventMsg<string>>();

subscribe(event => {
  runInAction(() => events.push(event));
  switch (event.type) {
    case 'observed': {
      break;
    }
    case 'update': {
      break;
    }
    case 'unobserved': {
      break;
    }
  }
});

const EditKey: React.FunctionComponent<{ prop: string }> = observer(
  ({ prop }) => {
    return (
      <TextInput
        value={root[prop]}
        onChange={({ target: { value } }) =>
          runInAction(() => (root[prop] = value))
        }
      />
    );
  }
);

const ObservedKeys: React.FunctionComponent<{}> = observer(({}) => {
  const keys = getObservedKeys(root);
  return (
    <ol>
      {[...keys.values()].map(key => (
        <li key={key}>{key}</li>
      ))}
    </ol>
  );
});

const SeenEvents: React.FunctionComponent<{}> = observer(({}) => {
  return (
    <ol>
      {events.reverse().map((event, i) => (
        <li key={i}>
          {event.key}: {event.type} {event.type === 'update' && event.value}
        </li>
      ))}
    </ol>
  );
});

const user = getDoc<NUser>('nuser-user2');

const RenderProject: FunctionComponent<{ project: NProject }> = observer(
  ({ project }) => {
    return (
      <Box>
        <h2>
          Project-{project._id} {project._rev}-
        </h2>
        <pre>{JSON.stringify(project.serialized, null, 2)}</pre>
        <TextInput
          value={project.name}
          onChange={({ target: { value } }) => project.setName(value)}
        />
      </Box>
    );
  }
);
const RenderUser: FunctionComponent<{ user: NUser }> = observer(({ user }) => {
  const local = useObservable({
    newProjectName: '',
  });

  return (
    <Box>
      <h1>User</h1>-{user._id} {user._rev}-
      <pre>{JSON.stringify(user.serialized, null, 2)}</pre>
      <TextInput
        value={user.name}
        onChange={({ target: { value } }) => user.setName(value)}
      />
      NewProject{' '}
      <TextInput
        value={local.newProjectName}
        onChange={({ target: { value } }) =>
          runInAction(() => (local.newProjectName = value))
        }
      />
      <Button
        label="Add project"
        onClick={action(() => {
          const project = new NProject({
            name: local.newProjectName,
          });
          local.newProjectName = '';
          user.addProject(project);
        })}
      />
      Got {user.projects.length} projectscd
      {user.projects$.map(proj => proj.name).join('+')}
      {user.projects$.map(task =>
        task.match({
          pending: () => 'loading',
          rejected: err => `error ${err.message}`,
          resolved: project => (
            <RenderProject key={project._id} project={project} />
          ),
        })
      )}
    </Box>
  );
});

export const Dev: FunctionComponent<{}> = observer(({}) => {
  return (
    <Box>
      {user.match({
        pending: () => 'loading',
        rejected: err => `error ${err.message}`,
        resolved: user => <RenderUser user={user} />,
      })}
    </Box>
  );
});
