import { Router, RouteComponentProps, navigate } from '@reach/router';
import React, { useContext } from 'react';

import { useNewUIContext } from '../../../contexts/ui';
import { Bug, MapLocation } from 'grommet-icons';
import {
  BuildingStoreyModel,
  AsyncBuildingStorey,
} from '../../../SPO/model/BuildingStorey/model';
import { Loader } from '../../../components/Loader/index';
import { BuildingStoreyOverview } from '../../../SPO/model/BuildingStorey/BuildingStoreyOverview';
import { subj } from '../../../utils/spo';
import { useModel } from '../../../contexts/spo-hub';
import { observer } from 'mobx-react-lite';

const BuildingStoreyContext = React.createContext<[BuildingStoreyModel, subj]>(
  null as any
);
export const useBuildingStorey = () => useContext(BuildingStoreyContext);

export const BuildingStorey: React.FunctionComponent<
  RouteComponentProps<{
    buildingStoreyId: string;
  }>
> = observer(({ buildingStoreyId }) => {
  const UIContext = useNewUIContext({
    navContext: {
      label: 'BuildingStorey',
      path: `/buildings/${buildingStoreyId}`,
    },
    contextSubMenu: {
      type: 'append',
      items: [
        {
          icon: Bug,
          actionFn: () =>
            navigate(`/buildings/${buildingStoreyId}/observations`),
          label: 'Bevindingen',
        },
        {
          icon: MapLocation,
          actionFn: () => navigate(`/buildings/${buildingStoreyId}/sheets`),
          label: 'Bouwlagen',
        },
      ],
    },
  });

  const subj = buildingStoreyId!.split('.');
  const building = useModel(AsyncBuildingStorey, subj);

  // console.log({ buildingStoreyId });
  return (
    <UIContext.Provider>
      {building.fold(
        building => (
          <BuildingStoreyContext.Provider value={[building, subj]}>
            <Router>
              <Overview path="/" />
            </Router>
          </BuildingStoreyContext.Provider>
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
> = () => <BuildingStoreyOverview buildingStorey={useBuildingStorey()} />;
