import { Box, Button, Layer, ResponsiveContext } from 'grommet';
import { Close } from 'grommet-icons';
import React, { useContext, ReactNode } from 'react';
import { MenuButton } from './MenuButton';

type PropsOf<
  T extends React.FunctionComponent<any>
> = T extends React.FunctionComponent<infer P> ? P : never;

export type SidebarMenuItem = ReactNode;

export const Sidebar: React.FunctionComponent<{
  onToggleSidebar: () => void;
}> = ({ onToggleSidebar, children, ...rest }) => {
  const size = useContext(ResponsiveContext);
  const SidebarComponent = size === 'small' ? Layer : Box;
  const sidebarProps =
    size === 'small'
      ? { full: true }
      : {
          fill: 'vertical' as const,
          width: 'small',
          background: 'light-2',
          elevation: 'xsmall',
        };
  return (
    <SidebarComponent {...sidebarProps} {...rest}>
      {size === 'small' && (
        <Box align="end">
          <Button icon={<Close />} onClick={onToggleSidebar} />
        </Box>
      )}
      {children}
    </SidebarComponent>
  );
};
