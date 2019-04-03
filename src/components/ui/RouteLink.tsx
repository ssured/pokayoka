import { Anchor, AnchorProps, Button, ButtonProps } from 'grommet';
import { Omit } from 'grommet/utils';
import React from 'react';
import { navigate } from '@reach/router';

export const RouteLink: React.FunctionComponent<
  AnchorProps & Omit<JSX.IntrinsicElements['a'], 'color'>
> = ({ onClick, ref, ...props }) => (
  <Anchor
    {...props}
    onClick={event => {
      event.preventDefault();
      navigate(event.currentTarget.href);
      onClick && onClick(event);
    }}
  />
);

export const RouteButton: React.FunctionComponent<
  ButtonProps &
    Omit<JSX.IntrinsicElements['button'], 'color'> & { href: string }
> = ({ onClick, ref, href, ...props }) => (
  <Button
    {...props}
    onClick={event => {
      event.preventDefault();
      navigate(href);
      onClick && onClick(event);
    }}
  />
);
