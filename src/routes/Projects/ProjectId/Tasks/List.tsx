import {
  Box,
  Button,
  Carousel,
  DropButton,
  Heading,
  Image,
  Layer,
  Meter,
  Stack,
  Text,
} from 'grommet';
import { Add, Clear, Close, Filter, FormClose, FormDown } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React, { useContext, useState } from 'react';
import { Page } from '../../../../components/Page/Page';
import { getSubject, useQuery } from '../../../../contexts/spo-hub';
import { fullName } from '../../../../model/Person';
import { isPTask } from '../../../../model/Task';
import { router } from '../../../../router';
import { Maybe } from '../../../../utils/universe';
import { PProjectContext } from '../Detail';
import { Hierarchy } from '../Hierarchy';

const SelectHierarchy: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  const [open, setOpen] = useState<boolean | undefined>(undefined);
  const close = () => {
    setOpen(false);
    setTimeout(() => setOpen(undefined), 1);
  };
  return (
    <DropButton
      label={
        <Box direction="row" gap="small">
          <Text>{project.name}</Text>
          <FormDown />
        </Box>
      }
      open={open}
      onClose={close}
      dropContent={
        <Layer full>
          <Box align="end">
            <Button icon={<Close />} onClick={close} />
          </Box>
          <Box pad="medium">
            <Hierarchy project={project} />
          </Box>
        </Layer>
      }
    />
  );
});

const FilterItem: React.FunctionComponent<{}> = ({ children }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      label={
        <Box direction="row" gap="small">
          {children}
          {hovered ? <Close /> : <FormClose />}
        </Box>
      }
    />
  );
};

const EditFilter: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  const [open, setOpen] = useState<boolean | undefined>(undefined);
  const close = () => {
    setOpen(false);
    setTimeout(() => setOpen(undefined), 1);
  };

  return (
    <DropButton
      icon={<Filter />}
      primary
      open={open}
      onClose={close}
      dropContent={
        <Layer full>
          <Box align="end">
            <Button icon={<Close />} onClick={close} />
          </Box>
          <Box pad="medium">Edit filter</Box>
        </Layer>
      }
    />
  );
});

type taskAssignedEntry = [string, PAssignment];
const entriesByHierarchy = (
  [, a]: taskAssignedEntry,
  [, b]: taskAssignedEntry
) => a.sortIndex - b.sortIndex;

const TaskRowItem: React.FunctionComponent<{
  task: PTask;
}> = observer(({ task }) => {
  const hierarchy = Object.entries(task.assigned).sort(entriesByHierarchy);
  return (
    <Box border direction="row" pad="small" margin="small">
      {Object.entries(task.basedOn).map(([key, observation]) => {
        const hashes = Object.values(observation.images);
        return hashes.length > 1 ? (
          <Carousel>
            {hashes.map(hash => (
              <Box width="small" height="small">
                <Image key={hash} src={`/cdn/${hash}`} fit="cover" />
              </Box>
            ))}
          </Carousel>
        ) : hashes.length > 0 ? (
          hashes.map(hash => (
            <Box width="small" height="small">
              <Image key={hash} src={`/cdn/${hash}`} fit="cover" />
            </Box>
          ))
        ) : (
          <Box width="small" height="small" align="center" justify="center">
            <Clear size="large" />
          </Box>
        );
      })}

      <Box direction="column" pad={{ left: 'medium' }}>
        <Box direction="row" align="center" gap="medium">
          {hierarchy.length > 0 && (
            <Meter
              size="xxsmall"
              thickness="xsmall"
              type="circle"
              background={
                (hierarchy[0][1].progress || 0) === 0
                  ? 'status-critical'
                  : 'status-warning'
              }
              values={[
                {
                  value: hierarchy[0][1].progress || 0,
                  label: `${hierarchy[0][1].progress || 0}%`,
                  color: 'status-ok',
                },
              ]}
            />
          )}
          <Heading level="3">{task.name}</Heading>
        </Box>

        {hierarchy.map(([key, { progress, person }], index) => (
          <Box
            key={key}
            direction="row"
            align="center"
            gap="medium"
            pad="xsmall"
          >
            {fullName(person)}
            {index === 0 ? (
              <small>(Eindverantwoordelijk)</small>
            ) : index === hierarchy.length - 1 ? (
              <small>(Verantwoordelijk)</small>
            ) : (
              ''
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
});

export const List: React.FunctionComponent<{
  project?: Maybe<PProject>;
}> = observer(({ project = useContext(PProjectContext) }) => {
  const results = useQuery(v => [
    {
      s: v('s'),
      p: '@type',
      o: 'PTask',
      // filter: tuple => true
    },
  ]);
  const tasks = results
    .map(result => getSubject<PTask>((result.variables as any).s))
    .filter(isPTask) as PTask[];

  return (
    <Page>
      <Stack fill anchor="bottom-right">
        <Box fill overflow={{ vertical: 'scroll' }}>
          <Box direction="row" justify="between">
            <SelectHierarchy project={project} />

            <Box direction="row" gap="medium">
              <FilterItem>Aannemer</FilterItem>
              <EditFilter project={project} />
            </Box>
          </Box>

          {tasks.map(task => (
            <TaskRowItem key={task.identifier} task={task} />
          ))}
        </Box>

        <Button
          plain={false}
          hoverIndicator
          icon={<Add size="large" />}
          onClick={() => router.projects.projectId.tasks.new.$push()}
        />
      </Stack>
    </Page>
  );
});
