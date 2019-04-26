import React, { FunctionComponent } from 'react';
import { useRoot } from '../contexts/spo-hub';
import { observer, useObservable } from 'mobx-react-lite';
import { SPOShape } from '../utils/spo';
import { Box, Button, Text } from 'grommet';
import { runInAction } from 'mobx';

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

export const Dev: FunctionComponent<{}> = observer(({}) => {
  const root = useRoot()();
  return <Part object={root} recurseDepth={2} />;
});
