import {
  Box,
  Button,
  DropButton,
  Layer,
  Stack,
  Text,
  Image,
  Heading,
  Meter,
} from 'grommet';
import {
  Add,
  Close,
  Filter,
  FormClose,
  FormDown,
  FormNext,
  FormPrevious,
  Radial,
  RadialSelected,
} from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React, { useState, useContext } from 'react';
import { Page, PageCrumb } from '../../../../components/Page/Page';
import { Maybe } from '../../../../utils/universe';
import { Hierarchy } from '../Hierarchy';
import { router } from '../../../../router';
import { PProjectContext } from '../Detail';
import { useQuery, getSubject } from '../../../../contexts/spo-hub';
import { isPTask } from '../../../../model/Task';
import { fullName } from '../../../../model/Person';

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
        return (
          <Stack key={key}>
            <Box width="small" height="small">
              {hashes.length > 0 && (
                <Image key={hashes[0]} src={`/cdn/${hashes[0]}`} fit="cover" />
              )}
            </Box>
            <Box fill direction="row" align="center" justify="between">
              <Button icon={<FormPrevious />} />
              <Button icon={<FormNext />} />
            </Box>
            <Box fill align="center" justify="end" pad="xsmall">
              <Box direction="row" background="rgba(255,255,255,0.6)" round>
                <Radial size="small" color="currentColor" />
                <Radial size="small" color="currentColor" />
                <RadialSelected size="small" color="currentColor" />
                <Radial size="small" color="currentColor" />
              </Box>
            </Box>
          </Stack>
        );
      })}

      <Box direction="column" pad={{ left: 'medium' }}>
        <Box direction="row" align="center" gap="medium">
          {hierarchy.length > 0 && (
            <Meter
              size="xxsmall"
              thickness="xsmall"
              type="circle"
              background="light-2"
              values={[
                {
                  value: hierarchy[0][1].progress || 0,
                  label: `${hierarchy[0][1].progress || 0}%`,
                },
              ]}
            />
          )}
          <Heading level="2">{task.name}</Heading>
        </Box>

        {hierarchy.map(([key, { progress, person }], index) => (
          <Box
            key={key}
            direction="row"
            align="center"
            gap="medium"
            pad="small"
          >
            {fullName(person)}
            {index === 0
              ? ' (Eindverantwoordelijk)'
              : index === hierarchy.length - 1
              ? ' (Verantwoordelijk)'
              : ''}
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
        <Box fill>
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
