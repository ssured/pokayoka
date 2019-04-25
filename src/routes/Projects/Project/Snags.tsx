import { Box, Button, DropButton, Layer, Text } from 'grommet';
import { Close, Filter, FormClose, FormDown } from 'grommet-icons';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Maybe } from '../../../utils/universe';
import { Hierarchy } from './Hierarchy';
import { Down } from 'grommet-icons';

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

export const Snags: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  return (
    <>
      <Box direction="row" justify="between">
        <SelectHierarchy project={project} />

        <Box direction="row" gap="medium">
          <FilterItem>Aannemer</FilterItem>
          <EditFilter project={project} />
        </Box>
      </Box>
    </>
  );
});
