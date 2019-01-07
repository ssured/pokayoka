import { css } from '@emotion/core';
import React, { useState } from 'react';
import { Manager, Popper, Reference } from 'react-popper';
import { Dot } from './Dot';
import { WhenClickedOutside } from '../../utils';
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
              <WhenClickedOutside trigger={() => setIsOpen(false)}>
                <Box
                  p={2}
                  bg="white"
                  css={css`
                    border: 1px solid rgba(0, 0, 0, 0.5);
                    border-radius: 6px;
                  `}
                >
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
                </Box>
              </WhenClickedOutside>
              <div ref={arrowProps.ref} style={arrowProps.style} />
            </div>
          )}
        </Popper>
      )}
    </Manager>
  );
};
