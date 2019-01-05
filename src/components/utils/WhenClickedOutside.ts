import React, { cloneElement } from 'react';
import useOnClickOutside from 'use-onclickoutside';

// Use this to add a trigger when clicking outside of the child element

export const WhenClickedOutside: React.FunctionComponent<{
  trigger: (event: MouseEvent) => void;
}> = function({ children, trigger }) {
  if (Array.isArray(children) || children == null) {
    throw new Error('WhenClickedOutside needs exactly one child');
  }
  const ref = React.useRef<typeof children>(null);
  useOnClickOutside(ref, trigger);

  return cloneElement(children as any, {
    innerRef: ref,
  });
};
