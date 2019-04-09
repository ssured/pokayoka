import React from 'react';
import { Accordion, AccordionPanel, Heading, Box, Image } from 'grommet';
import { ProjectFormEdit } from './ProjectFormEdit';
import { PartialProject } from './model';
import { SiteFormEdit } from '../Site/SiteFormEdit';
import { observer, useObservable } from 'mobx-react-lite';
import { action } from 'mobx';
import { BuildingFormEdit } from '../Building/BuildingFormEdit';

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
          <Box direction="row" align="center" gap="medium">
            {project.$image && (
              <Box height="small" width="small">
                <Image src={`/cdn/${project.$image}`} fit="cover" />
              </Box>
            )}
            <Heading level="1">
              {project.code} {project.name}
            </Heading>
          </Box>
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
              header={<Heading level="2">&nbsp;{site.name}</Heading>}
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
                        <Box direction="row" align="center" gap="medium">
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
                            <div key={key}>
                              <Heading level="3">{buildingStorey.name}</Heading>
                            </div>
                          )
                      ),
                  ]
              ),
          ]
      )}
    </Accordion>
  );
});
