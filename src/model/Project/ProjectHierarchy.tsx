import React from 'react';
import { Accordion, AccordionPanel, Heading, Box, Image, Grid } from 'grommet';
import { ProjectFormEdit } from './ProjectFormEdit';
import { PartialProject } from './model';
import { SiteFormEdit } from '../Site/SiteFormEdit';
import { observer, useObservable } from 'mobx-react-lite';
import { action } from 'mobx';
import { BuildingFormEdit } from '../Building/BuildingFormEdit';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { Add } from 'grommet-icons';
import { BuildingStoreyFormCreate } from '../BuildingStorey/BuildingStoreyFormCreate';
import { updateSubject, setSubject } from '../base';
import { generateId } from '../../../server/utils/snag-id';
import { BuildingStoreyFormEdit } from '../BuildingStorey/BuildingStoreyFormEdit';

export const ProjectHierarchy: React.FunctionComponent<{
  project: PartialProject;
}> = observer(({ project }) => {
  const s = useObservable({
    activeIndex: undefined as number | undefined,
    setActiveIndex: action((index: number | undefined) => {
      s.activeIndex = index;
    }),
  });

  const closePanels = () => s.setActiveIndex(undefined);

  return (
    <Accordion
      animate
      multiple={false}
      margin="small"
      activeIndex={s.activeIndex}
      onActive={(indexes?: number[]) => s.setActiveIndex(indexes && indexes[0])}
    >
      <AccordionPanel
        header={
          <Grid
            fill
            rows={['auto', 'auto']}
            columns={['auto', 'flex']}
            areas={[
              // { name: 'header', start: [0, 0], end: [1, 0] },
              { name: 'title', start: [0, 0], end: [1, 0] },
              { name: 'image', start: [0, 1], end: [0, 1] },
              { name: 'map', start: [1, 1], end: [1, 1] },
            ]}
            gap="medium"
          >
            <Heading level="1" gridArea="title">
              <code>{project.code}</code> {project.name}
            </Heading>

            {project.$image && (
              <Box height="small" width="small" gridArea="image">
                <Image src={`/cdn/${project.$image}`} fit="cover" />
              </Box>
            )}

            <Box gridArea="map" style={{ position: 'relative' }}>
              <Map
                center={[52.2975, 6.318611]}
                zoom={14}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker
                  position={[52.2975, 6.318611]}
                  draggable
                  onDragend={console.log}
                />
              </Map>
            </Box>
          </Grid>
        }
      >
        <ProjectFormEdit
          heading={null}
          project={project}
          onCancel={closePanels}
          afterSubmit={closePanels}
        />
      </AccordionPanel>
      {Object.entries(project.sites || {}).map(
        ([key, site]) =>
          site && [
            <AccordionPanel
              key={key}
              header={
                <Box margin="medium">
                  <Heading level="3">Locatie: {site.name}</Heading>
                </Box>
              }
            >
              <SiteFormEdit
                heading={null}
                site={site}
                onCancel={closePanels}
                afterSubmit={closePanels}
              />
            </AccordionPanel>,
            ...Object.entries(site.buildings || {})
              .filter(([, building]) => building)
              .map(
                ([key, building]) =>
                  building && [
                    <AccordionPanel
                      key={key}
                      header={
                        <Box
                          direction="row"
                          align="center"
                          margin="medium"
                          gap="medium"
                        >
                          {building.$image && (
                            <Box height="xsmall" width="xsmall">
                              <Image
                                src={`/cdn/${building.$image}`}
                                fit="cover"
                              />
                            </Box>
                          )}
                          <Heading level="3">{building.name}</Heading>
                        </Box>
                      }
                    >
                      <BuildingFormEdit
                        heading={null}
                        building={building}
                        onCancel={closePanels}
                        afterSubmit={closePanels}
                      />
                    </AccordionPanel>,
                    ...Object.entries(building.buildingStoreys || {})
                      .filter(([, buildingStorey]) => buildingStorey)
                      .map(
                        ([key, buildingStorey]) =>
                          buildingStorey && (
                            <AccordionPanel
                              key={key}
                              header={
                                <Box
                                  direction="row"
                                  align="center"
                                  margin="medium"
                                  gap="medium"
                                >
                                  {/* {building.$image && (
                            <Box height="xsmall" width="xsmall">
                              <Image
                                src={`/cdn/${building.$image}`}
                                fit="cover"
                              />
                            </Box>
                          )} */}
                                  <Heading level="4">
                                    {buildingStorey.name}
                                  </Heading>
                                </Box>
                              }
                            >
                              <BuildingStoreyFormEdit
                                heading={null}
                                buildingStorey={buildingStorey}
                                onCancel={closePanels}
                                afterSubmit={closePanels}
                              />
                            </AccordionPanel>
                          )
                      ),
                    <AccordionPanel
                      key={`${key}_add_storey`}
                      header={
                        <Box
                          direction="row"
                          align="center"
                          margin="small"
                          gap="medium"
                        >
                          <Add size="medium" />

                          <Heading level="4">Plattegrond toevoegen</Heading>
                        </Box>
                      }
                    >
                      <BuildingStoreyFormCreate
                        onSubmit={async data => {
                          const storey = {
                            [generateId()]: {
                              sheets: {},
                              tasks: {},
                              ...data,
                            },
                          };
                          if (!building.buildingStoreys) {
                            setSubject(building, 'buildingStoreys', storey);
                          }
                          updateSubject(building.buildingStoreys!, storey);
                        }}
                      />
                    </AccordionPanel>,
                  ]
              ),
          ]
      )}
    </Accordion>
  );
});
