import { Router, RouteComponentProps, navigate } from '@reach/router';
import React, { useContext } from 'react';

import { useNewUIContext } from '../../../contexts/ui';
import {
  BuildingStoreyModel,
  AsyncBuildingStorey,
} from '../../../model/BuildingStorey/model';
import { Loader } from '../../../components/Loader/index';
import { BuildingStoreyOverview } from '../../../model/BuildingStorey/BuildingStoreyOverview';
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
      path: `/buildingStoreys/${buildingStoreyId}`,
    },
  });

  const subj = buildingStoreyId!.split('.');
  const buildingStorey = useModel(AsyncBuildingStorey, subj);

  // console.log({ buildingStoreyId });
  return (
    <UIContext.Provider>
      {buildingStorey.fold(
        buildingStorey => (
          <BuildingStoreyContext.Provider value={[buildingStorey, subj]}>
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
