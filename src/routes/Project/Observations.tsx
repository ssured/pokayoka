import React from 'react';
import { useObserver } from 'mobx-react-lite';
import { Heading, Box, Image as GImage } from 'grommet';
import { RouteComponentProps } from '@reach/router';
import { useProjectId } from '.';
import { useModel, useQuery } from '../../contexts/store';
import { Project } from '../../models/Project';
import { Observation as ObservationModel } from '../../models/Observation';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import styled from 'styled-components';
import { useUITitle } from '../../contexts/ui';

const LoadingIndicator = () => <p>Loading...</p>;
const ErrorMessage = (error: Error) => (
  <h3>Uh oh, something happened {error.message}</h3>
);

const ITEM_HEIGHT = 150;

const Grid = styled(Box)`
  height: ${ITEM_HEIGHT}px;
  display: grid;
  grid-gap: 2px;

  border-bottom: 1px solid lightgrey;
  /* > * {
    border: 1px solid lightgrey;
  } */

  grid-template-areas:
    'image header '
    'image body   '
    'image labels ';
  grid-template-rows: 40px 1fr 20px;
  grid-template-columns: 1fr 5fr;
`;

const Image = styled(GImage)`
  grid-area: image;
`;

const Header = styled(Heading)`
  grid-area: header;
`;
const Body = styled.div`
  grid-area: body;
`;
const Labels = styled.div`
  grid-area: labels;
`;

const UnstyledLabel: React.FunctionComponent<{
  className?: string;
  color?: string;
}> = ({ className, children, color = 'red' }) => (
  <span className={className}>{children}</span>
);

const Label = styled(UnstyledLabel)`
  position: relative;
  background: ${props => props.color};

  &:after,
  &:before {
    right: 100%;
    top: 50%;
    border: solid transparent;
    content: ' ';
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
  }

  &:after {
    border-color: transparent;
    border-right-color: ${props => props.color};
    border-width: 0.65em;
    margin-top: -0.65em;
  }
`;

const Observation: React.FunctionComponent<{
  data: string[];
  index: number;
  style: any;
}> = ({ data, index, style }) => {
  const observation = useModel(ObservationModel, data[index]);

  return useObserver(() => (
    <div style={style}>
      {observation.fold(
        LoadingIndicator,
        observation => (
          <Grid>
            <Header level="3">{observation.title}</Header>
            <Body>
              <Label color="red">{observation.title}</Label>
            </Body>
            <Labels>
              {[...observation.labelsSet].map(label => (
                <Label key={label}>{label}</Label>
              ))}
            </Labels>
            {observation.images.size > 0 && (
              <Image
                fit="cover"
                src={[...observation.images.values()][0].src}
              />
            )}
          </Grid>
        ),
        ErrorMessage
      )}
    </div>
  ));
};

export const Observations: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => {
  const projectId = useProjectId();
  const project = useModel(Project, projectId);
  useUITitle((project.value && project.value.name) || '');

  const query = useQuery<{ observationId: [string]; title: string }>(
    v => [
      { s: v('observationId'), p: 'type', o: 'observation' },
      {
        s: v('observationId'),
        p: 'title',
        o: v('title'),
        filter: ({ o }) => String(o).indexOf('--') === -1,
      },
    ],
    []
  );

  return useObserver(() => (
    <Box>
      {project.fold(
        LoadingIndicator,
        project => (
          <>
            <Heading>Project {project.name}</Heading>
            {query.fold(
              LoadingIndicator,
              results => (
                <FixedSizeList
                  height={500}
                  itemData={results.map(r => r.observationId[0])}
                  itemCount={results.length}
                  itemSize={ITEM_HEIGHT}
                  width={'100%'}
                >
                  {Observation}
                </FixedSizeList>
              ),
              ErrorMessage
            )}
          </>
        ),
        ErrorMessage
      )}
    </Box>
  ));
};
