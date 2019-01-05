import React, { useState } from 'react';
import { Manager, Reference, Popper } from 'react-popper';

import useOnClickOutside from 'use-onclickoutside';

const Modal: React.SFC<{ onClose: () => void }> = ({ onClose, children }) => {
  const ref = React.useRef<any>(null);
  useOnClickOutside(ref, onClose);

  return (
    <Box
      innerRef={ref}
      p={2}
      bg="white"
      css={css`
        border: 1px solid rgba(0, 0, 0, 0.5);
        border-radius: 6px;
      `}
    >
      {children}
    </Box>
  );
};

import { Dot } from './Dot';
import { css } from 'emotion';
import { Box } from '../../base';

export const ColorPicker: React.SFC<{
  color: string;
  colors: string[];
  setColor: (color: string) => void;
  size?: number;
}> = ({ color, colors, setColor, size = 16 }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleIsOpen = () => setIsOpen(!isOpen);

  return (
    <Manager>
      <Reference>
        {({ ref }) => (
          <Dot innerRef={ref} onClick={toggleIsOpen} bg={color} size={size} />
        )}
      </Reference>
      {isOpen && (
        <Popper>
          {({ ref, style, placement, arrowProps }) => (
            <div ref={ref} style={style} data-placement={placement}>
              <Modal onClose={() => setIsOpen(false)}>
                {colors.map(color => (
                  <Dot
                    key={color}
                    bg={color}
                    onClick={() => {
                      setColor(color);
                      setIsOpen(false);
                    }}
                    size={size * 1.5}
                    css={css({ cursor: 'pointer' })}
                  />
                ))}
              </Modal>
              <div ref={arrowProps.ref} style={arrowProps.style} />
            </div>
          )}
        </Popper>
      )}
    </Manager>
  );
};
