import { Anchor, AnchorProps } from 'grommet';
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
