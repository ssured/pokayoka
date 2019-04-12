import { RouteComponentProps } from '@reach/router';
import { Text, Box, Grid, TextInput, Image, Heading } from 'grommet';
import { Image as ImageIcon, Add } from 'grommet-icons';
import { observer, useObserver } from 'mobx-react-lite';
import React, { useContext, ReactNode } from 'react';
import { useQuery, SPOContext } from '../../contexts/spo-hub';
import { PartialProject } from '../../model/Project/model';
import { subj, SPOShape } from '../../utils/spo';
import { Page } from '../../components/Page/Page';
import { useToggle } from 'react-use';
import { TextButton } from '../../components/TextButton';
import {
  useLens,
  LensShowComponent,
  LensEditComponent,
} from '../../hooks/lens';
import { setSubject } from '../../model/base';
import { KeysOfType } from '../../utils/typescript';
import { UndefinedOrPartialSPO } from '../../utils/spo-observable';

export const ProjectPage: React.FunctionComponent<
  RouteComponentProps<{ projectCode: string }> & {}
> = observer(({ projectCode }) => {
  const { get } = useContext(SPOContext);
  const q = useQuery(v => [{ s: v('s'), p: 'code', o: projectCode }]);
  const [showEdit, toggleEdit] = useToggle(false);

  const project =
    q.length === 1
      ? (get(q[0].variables.s as subj) as PartialProject)
      : undefined;

  if (project) {
    return (
      <Page
        titles={[[project.name || '', `/paged/${projectCode}`]]}
        right={
          <TextButton
            label={showEdit ? 'verwijder project' : 'wijzig project'}
            onClick={() => toggleEdit()}
          />
        }
      >
        {showEdit ? (
          <ProjectEdit project={project} />
        ) : (
          <ProjectShow project={project} />
        )}
      </Page>
    );
  }

  return <div>Loading project</div>;
});

const TextInputStatic: React.FunctionComponent<{}> = ({ children }) => (
  <Text truncate>{children}</Text>
);

interface EditInlineStringPropProps<T extends SPOShape> {
  subject: UndefinedOrPartialSPO<T>;
  prop: KeysOfType<Required<T>, string>;
  rtl?: boolean;
  show?: LensShowComponent<string | undefined>;
  edit?: LensEditComponent<string | undefined>;
}

function EditInlineStringProp<T extends SPOShape>({
  subject,
  prop,
  rtl,
  show = value => <TextInputStatic>{value}</TextInputStatic>,
  edit = ([value, setValue]) => (
    <TextInput
      value={value || ''}
      onChange={e => {
        setValue(e.target.value);
      }}
    />
  ),
}: EditInlineStringPropProps<T>): ReturnType<
  React.FunctionComponent<EditInlineStringPropProps<T>>
> {
  const lens = useLens(
    {
      getter: () => subject[prop] as string | undefined,
      setter: value => setSubject(subject, prop, value as any),
    },
    [subject, prop]
  );
  return useObserver(() => {
    const value = (
      <Box justify="center">
        {lens.fold({
          show,
          edit,
        })}
      </Box>
    );
    const button = (
      <Box justify="center">
        {lens.fold({
          busy: () => null,
          show: (_, { editButtonProps }) => (
            <TextButton {...editButtonProps} label="Edit" />
          ),
          edit: (_, { saveButtonProps, cancelButtonProps }) => (
            <Box direction="row" gap="medium">
              <TextButton {...saveButtonProps} label="Save" />
              <TextButton {...cancelButtonProps} label="Cancel" />
            </Box>
          ),
        })}
      </Box>
    );
    return rtl ? (
      <>
        {button}
        {value}
      </>
    ) : (
      <>
        {value}
        {button}
      </>
    );
  });
}

const PageSection: React.FunctionComponent<{
  heading: string;
  action?: ReactNode;
}> = ({ heading, action }) => (
  <Box direction="row" justify="between" border="bottom">
    <Heading level="3" margin={{ bottom: 'xsmall' }}>
      {heading}
    </Heading>
    {action && (
      <Box direction="row" align="end" margin={{ bottom: 'xsmall' }}>
        {action}
      </Box>
    )}
  </Box>
);

const ProjectShow: React.FunctionComponent<{
  project: PartialProject;
}> = observer(({ project }) => {
  return (
    <>
      <Box direction="row" justify="between">
        <Grid columns={['flex', 'auto']} gap="medium">
          <EditInlineStringProp subject={project} prop="name" />
          <EditInlineStringProp subject={project} prop="code" />
        </Grid>
        <Grid columns={['flex', 'auto']} gap="medium" align="end" justify="end">
          <EditInlineStringProp
            subject={project}
            prop="$image"
            rtl
            show={value =>
              value ? (
                <Box width="small" height="small">
                  <Image src={`/cdn/${value}`} fit="cover" />
                </Box>
              ) : (
                <ImageIcon />
              )
            }
          />
        </Grid>
      </Box>

      <PageSection
        heading="Contactpersonen"
        action={
          <TextButton>
            <Add size="small" color="currentColor" /> contactpersoon
          </TextButton>
        }
      />

      <PageSection
        heading="Locaties"
        action={
          <TextButton>
            <Add size="small" color="currentColor" /> locatie
          </TextButton>
        }
      />
    </>
  );
});

const ProjectEdit: React.FunctionComponent<{
  project: PartialProject;
}> = observer(({ project }) => {
  return <Text>Edit {project.name}</Text>;
});
