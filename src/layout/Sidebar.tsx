import { Box, Button, Layer, ResponsiveContext } from 'grommet';
import { Close } from 'grommet-icons';
import React, { useContext } from 'react';
import { MenuButton } from './MenuButton';

type PropsOf<
  T extends React.FunctionComponent<any>
> = T extends React.FunctionComponent<infer P> ? P : never;

export type SidebarMenuItem = Pick<
  PropsOf<typeof MenuButton>,
  'icon' | 'onClick'
> & { label: string };

export const Sidebar: React.FunctionComponent<{
  children?: undefined;
  items: SidebarMenuItem[];
  onToggleSidebar: () => void;
}> = ({ items, onToggleSidebar, ...rest }) => {
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
      {items.map(item => (
        <MenuButton key={item.label} {...item} />
      ))}
    </SidebarComponent>
  );
};
