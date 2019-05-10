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
  requestSet: (key, value) => true,
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
      {events.map((event, i) => (
        <li key={i}>
          {event.key}: {event.type} {event.type === 'update' && event.value}
        </li>
      ))}
    </ol>
  );
});

export const Dev: FunctionComponent<{}> = observer(({}) => {
  // const root = useRoot()();
  // return <Part object={root} recurseDepth={2} />;

  const state = useObservable({
    keys: observable.set<string>(['a', 'b']),
    newName: '',
  });
  const { keys, newName } = state;

  return (
    <Box>
      {[...keys.values()].map(key => (
        <Box border key={key} direction="row">
          {key}
          <EditKey prop={key} />
          <Button icon={<Close />} onClick={action(() => keys.delete(key))} />
        </Box>
      ))}

      <Box border background="light-2" direction="row">
        <TextInput
          placeholder="add key"
          value={newName}
          onChange={({ target: { value } }) =>
            runInAction(() => (state.newName = value))
          }
        />
        <Button
          icon={<Add />}
          onClick={action(() => {
            keys.add(state.newName);
            state.newName = '';
          })}
        />
      </Box>
      <Box direction="row">
        <ObservedKeys />
        <SeenEvents />
      </Box>
    </Box>
  );
});
