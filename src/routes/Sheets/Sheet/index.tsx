import { Router, RouteComponentProps, navigate } from '@reach/router';
import React, { useContext } from 'react';

import { useNewUIContext } from '../../../contexts/ui';
import { SheetModel, AsyncSheet } from '../../../model/Sheet/model';
import { Loader } from '../../../components/Loader/index';
import { SheetMap } from '../../../model/Sheet/SheetMap';
import { subj } from '../../../utils/spo';
import { useModel } from '../../../contexts/spo-hub';
import { observer } from 'mobx-react-lite';

const SheetContext = React.createContext<[SheetModel, subj]>(null as any);
export const useSheet = () => useContext(SheetContext);

export const Sheet: React.FunctionComponent<
  RouteComponentProps<{
    sheetId: string;
  }>
> = observer(({ sheetId }) => {
  const UIContext = useNewUIContext({
    navContext: {
      label: 'Sheet',
      path: `/sheets/${sheetId}`,
    },
  });

  const subj = sheetId!.split('.');
  const sheet = useModel(AsyncSheet, subj);

  // console.log({ sheetId });
  return (
    <UIContext.Provider>
      {sheet.fold(
        sheet => (
          <SheetContext.Provider value={[sheet, subj]}>
            <Router>
              <Map path="/" />
            </Router>
          </SheetContext.Provider>
        ),
        partial => (
          <Loader />
        )
      )}
    </UIContext.Provider>
  );
});

export const Map: React.FunctionComponent<RouteComponentProps<{}>> = () => (
  <SheetMap sheet={useSheet()} />
);
