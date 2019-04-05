import { Router, RouteComponentProps, navigate } from '@reach/router';
import React, { useContext } from 'react';

import { useNewUIContext } from '../../../contexts/ui';
import { Bug, MapLocation } from 'grommet-icons';
import { SiteModel, AsyncSite } from '../../../model/Site/model';
import { Loader } from '../../../components/Loader/index';
import { SiteOverview } from '../../../model/Site/SiteOverview';
import { subj } from '../../../utils/spo';
import { useModel } from '../../../contexts/spo-hub';
import { observer } from 'mobx-react-lite';

const SiteContext = React.createContext<[SiteModel, subj]>(null as any);
export const useSite = () => useContext(SiteContext);

export const Site: React.FunctionComponent<
  RouteComponentProps<{
    siteId: string;
  }>
> = observer(({ siteId }) => {
  const UIContext = useNewUIContext({
    navContext: { label: 'Site', path: `/sites/${siteId}` },
    contextSubMenu: {
      type: 'append',
      items: [
        {
          icon: Bug,
          actionFn: () => navigate(`/sites/${siteId}/observations`),
          label: 'Bevindingen',
        },
        {
          icon: MapLocation,
          actionFn: () => navigate(`/sites/${siteId}/sheets`),
          label: 'Bouwlagen',
        },
      ],
    },
  });

  const subj = siteId!.split('.');
  const site = useModel(AsyncSite, subj);

  // console.log({ siteId });
  return (
    <UIContext.Provider>
      {site.fold(
        site => (
          <SiteContext.Provider value={[site, subj]}>
            <Router>
              <Overview path="/" />
            </Router>
          </SiteContext.Provider>
        ),
        partial => (
          <Loader />
        )
      )}
    </UIContext.Provider>
  );
});

export const Overview: React.FunctionComponent<
  RouteComponentProps<{}>
> = () => <SiteOverview site={useSite()} />;
