import React from 'react';
import { Button, Text } from 'grommet';
import styled from 'styled-components';

const UnstyledMenuItemButton: React.FunctionComponent<{
  className?: string;
  icon: React.ElementType;
  label: string;
  actionFn: (...args: any[]) => any;
  children?: never;
}> = ({ className = '', icon, label, actionFn }) => {
  const Icon = icon;
  return (
    <div className={`${className} menu-item`}>
      <Button
        plain
        className={`${className} icon`}
        onClick={actionFn}
        title={label}
        a11yTitle={label}
      >
        <ButtonLiner>
          <Icon size="medium" />
        </ButtonLiner>
      </Button>
      <Button
        plain
        className={`${className} label`}
        onClick={actionFn}
        title={label}
        a11yTitle={label}
      >
        <ButtonLiner>
          <Text>{label}</Text>
        </ButtonLiner>
      </Button>
    </div>
  );
};

const UnstyledButtonLiner: React.FunctionComponent<{
  className?: string;
}> = ({ className = '', children }) => (
  <div className={className}>{children}</div>
);

export const ButtonLiner = styled(UnstyledButtonLiner)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 12px;
  outline: none;
`;

export const MenuItemButton = styled(UnstyledMenuItemButton)`
  /* MEDIA=PHONES */
  @media only screen and (max-width: 767px) {
    .button-inner {
      padding: 16px 24px;
    }
  }
`;
