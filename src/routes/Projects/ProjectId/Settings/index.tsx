import { Route } from 'boring-router-react';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Page, PageTitle } from '../../../../components/Page/Page';
import { RoutedButton } from '../../../../layout/RoutedButton';
import { router } from '../../../../router';
import { Maybe } from '../../../../utils/universe';
import { AddContactPerson } from './AddContactPerson';
import { ProjectSettings } from './ProjectSettings';
import { Settings as SiteSettings } from './SiteId/Settings';
import { SiteId } from './SiteId/index';

export const Settings: React.FunctionComponent<{
  project: Maybe<PProject>;
}> = observer(({ project }) => {
  return (
    <>
      <Route match={router.projects.projectId.settings} exact>
        <Page>
          <ProjectSettings project={project} />
        </Page>
      </Route>
      <Route match={router.projects.projectId.settings.addContact} exact>
        <PageTitle title={[['Contactpersoon toevoegen']]}>
          <Page>
            <AddContactPerson
              onSubmit={async role => {
                project.roles[role.identifier] = role;
                router.projects.projectId.settings.$replace();
              }}
            />
          </Page>
        </PageTitle>
      </Route>
      <Route match={router.projects.projectId.settings.siteId}>
        <PageTitle
          title={[
            [
              (site => (
                <RoutedButton
                  to={router.projects.projectId.settings.siteId}
                  label={`Locatie: ${site.name}`}
                  active={false}
                />
              ))(
                project.sites[
                  router.projects.projectId.settings.siteId.$params.siteId
                ]
              ),
            ],
          ]}
        >
          <SiteId
            site={
              project.sites[
                router.projects.projectId.settings.siteId.$params.siteId
              ]
            }
          />
        </PageTitle>
      </Route>
    </>
  );
});
