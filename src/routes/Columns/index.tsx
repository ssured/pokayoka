import { RouteComponentProps } from '@reach/router';
import {
  Accordion,
  AccordionPanel,
  Box,
  Button,
  Grid,
  Heading,
  Menu,
  Select,
  Anchor,
} from 'grommet';
import {
  Clock,
  Configure,
  Filter,
  Inherit,
  Location,
  Map,
  Next,
  Tag,
  Trash,
  Up,
  UserWorker,
} from 'grommet-icons';
import { action } from 'mobx';
import { observer, useObservable } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { useQuery, SPOContext } from '../../contexts/spo-hub';
import { PartialProject } from '../../model/Project/model';
import { subj } from '../../utils/spo';

export const Columns: React.FunctionComponent<
  RouteComponentProps<{ projectCode: string }> & {}
> = observer(({ projectCode }) => {
  const { account, query, get } = useContext(SPOContext);
  const q = useQuery(v => [{ s: v('s'), p: 'code', o: projectCode }]);

  return q.length === 1 ? (
    <Snagging project={get(q[0].variables.s as subj)} />
  ) : (
    <div>Loading {q.length}</div>
  );
});

const Snagging: React.FunctionComponent<{ project: PartialProject }> = observer(
  ({ project }) => {
    const s = useObservable({
      activeIndex: 1,
      onAccordeonActiveIndexes: action((indexes: number[]) => {
        s.activeIndex = indexes[0];
      }),
    });

    return (
      <Grid
        fill
        rows={['auto', 'flex', 'auto']}
        columns={['auto', 'flex']}
        areas={[
          // { name: 'header', start: [0, 0], end: [1, 0] },
          { name: 'title', start: [0, 0], end: [0, 0] },
          { name: 'filters', start: [0, 1], end: [0, 1] },
          { name: 'buttons', start: [0, 2], end: [0, 2] },
          { name: 'main', start: [1, 0], end: [1, 0] },
        ]}
      >
        {/* <Box gridArea="title" direction="column">
        <Menu
          label={
            <Heading level="3">
              Pokayoka
              <br />
              Molukkenstraat
            </Heading>
          }
          items={[
            {
              icon: <Location />,
              label: 'Hyperion',
              onClick: () => alert('Hyperion'),
            },
          ]}
        />
      </Box> */}

        <Box gridArea="filters" direction="column">
          {/* <Heading level="5" margin="small">
          3 actieve filters
        </Heading> */}
          <Accordion
            animate
            multiple={false}
            margin="small"
            activeIndex={s.activeIndex}
            onActive={s.onAccordeonActiveIndexes}
          >
            <AccordionPanel
              label={
                <Heading level="4">
                  <Map /> 2e Verdieping
                </Heading>
              }
            >
              Hier een minimap als het een sheet is
            </AccordionPanel>

            <AccordionPanel
              header={
                <Box align="center" direction="row" justify="between">
                  <Heading level="4">
                    <UserWorker /> ITBB installatie techniek
                  </Heading>
                </Box>
              }
            >
              <Box
                direction="column"
                pad="small"
                gap="small"
                background="light-1"
              >
                <Anchor icon={<Up />} label="Installaties" />
                <Anchor icon={<Next />} label="ITBB W" />
                <Anchor icon={<Next />} label="ITBB W" />
                <Select
                  placeholder="Alle onderaannemers"
                  options={[
                    'BGDD',
                    ' - Uitvoering',
                    '   - Yoeri Luitwieler',
                    ' - Kwaliteitsborging',
                    '   - Erik Duiker',
                    '   - Sjors Dijkstra',
                    'Extern',
                    ' - installaties',
                    '   - ITBB installatie techniek',
                    '     - ITBB W',
                    '     - ITBB E',
                    '   - Dolman Draaideuren',
                    ' - Bruynzeel',
                  ]}
                  onSearch={text => console.log(text)}
                />
                <Box direction="row" justify="between">
                  <Button
                    icon={<Trash />}
                    label="verwijder"
                    a11yTitle={
                      'Verwijder filter op ITBB installatie techniek uit actieve filters'
                    }
                    hoverIndicator
                    onClick={() => {}}
                  />
                  <Anchor
                    icon={<Configure />}
                    a11yTitle="Bewerk onderaannemers"
                    onClick={() => {}}
                  />
                </Box>
              </Box>
            </AccordionPanel>

            <AccordionPanel
              label={
                <Heading level="4">
                  <Tag /> Hoog
                </Heading>
              }
            >
              <Box height="medium" background="light-1">
                Panel 3 content
              </Box>
            </AccordionPanel>
          </Accordion>
        </Box>

        <Box gridArea="buttons" direction="column">
          <Menu
            icon={<Filter />}
            dropAlign={{ bottom: 'top', left: 'left' }}
            label="Filter toevoegen"
            items={[
              {
                icon: <Location />,
                label: 'Locatie / gebouw',
                onClick: () => {},
              },
              {
                icon: <UserWorker />,
                label: 'Onderaannemer',
                onClick: () => {},
              },
              {
                icon: <Tag />,
                label: 'Label',
                onClick: () => {},
              },
              {
                icon: <Inherit />,
                label: 'NLSfB',
                onClick: () => {},
              },
              {
                icon: <Clock />,
                label: 'Tijdlijn',
                onClick: () => {},
              },
            ]}
          />
        </Box>

        <Box gridArea="main" direction="column" justify="center">
          Main {project.name} {project.code}
        </Box>
      </Grid>
    );
  }
);
