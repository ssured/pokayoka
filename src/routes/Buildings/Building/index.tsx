import { Router, RouteComponentProps, navigate } from '@reach/router';
import React, { useContext } from 'react';

import { useNewUIContext } from '../../../contexts/ui';
import { Bug, MapLocation } from 'grommet-icons';
import { BuildingModel, AsyncBuilding } from '../../../model/Building/model';
import { Loader } from '../../../components/Loader/index';
import { BuildingOverview } from '../../../model/Building/BuildingOverview';
import { subj } from '../../../utils/spo';
import { useModel } from '../../../contexts/spo-hub';
import { observer } from 'mobx-react-lite';

const BuildingContext = React.createContext<[BuildingModel, subj]>(null as any);
export const useBuilding = () => useContext(BuildingContext);

export const Building: React.FunctionComponent<
  RouteComponentProps<{
    buildingId: string;
  }>
> = observer(({ buildingId }) => {
  const UIContext = useNewUIContext({
    navContext: { label: 'Building', path: `/buildings/${buildingId}` },
    contextSubMenu: {
      type: 'append',
      items: [
        {
          icon: Bug,
          actionFn: () => navigate(`/buildings/${buildingId}/observations`),
          label: 'Bevindingen',
        },
        {
          icon: MapLocation,
          actionFn: () => navigate(`/buildings/${buildingId}/sheets`),
          label: 'Bouwlagen',
        },
      ],
    },
  });

  const subj = buildingId!.split('.');
  const building = useModel(AsyncBuilding, subj);

  // console.log({ buildingId });
  return (
    <UIContext.Provider>
      {building.fold(
        building => (
          <BuildingContext.Provider value={[building, subj]}>
            <Router>
              <Overview path="/" />
            </Router>
          </BuildingContext.Provider>
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
> = () => <BuildingOverview building={useBuilding()} />;
