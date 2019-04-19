import { Anchor, Box, Text } from 'grommet';
import { Close, Info } from 'grommet-icons';
import React, { ReactNode, useState } from 'react';

export const InfoNotification: React.FunctionComponent<{
  message: ReactNode;
  action?: ReactNode;
}> = ({ message, action }) => {
  const [show, setShow] = useState(true);

  return show ? (
    <Box
      fill="horizontal"
      background="status-unknown"
      direction="row"
      align="center"
      justify="between"
      pad="medium"
    >
      <Box direction="row" gap="medium" align="center">
        <Info size="medium" />
        <Text>{message}</Text>
      </Box>

      {action || <Close onClick={() => setShow(false)} />}
    </Box>
  ) : (
    <></>
  );
};
