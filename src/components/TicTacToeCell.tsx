import React, { Component } from 'react';
import styled from '@emotion/styled';

const Button = styled.button<{ disabled: boolean }>`
  padding: 2rem;
  margin: 2rem;
  border: 1px solid black;
  border-radius: 1rem;
  font-size: 200%;
  background: ${({ disabled }) => (disabled ? `rgba(0,0,0,0.2)` : undefined)};
`;

type TicTacToeProps = {
  /**
   * Value to display, either empty (" ") or "X" / "O".
   *
   * @default " "
   **/
  value?: ' ' | 'X' | 'O';

  /** Cell position on game board. */
  position: { x: number; y: number };

  /** Called when an empty cell is clicked. */
  onClick?: (x: number, y: number) => void;
};

/**
 * TicTacToe game cell. Displays a clickable button when the value is " ",
 * otherwise displays "X" or "O".
 */
// Notice the named export here, this is required for docgen information
// to be generated correctly.
export class TicTacToeCell extends Component<TicTacToeProps> {
  handleClick = () => {
    const {
      position: { x, y },
      onClick,
    } = this.props;
    if (!onClick) return;

    onClick(x, y);
  };

  render() {
    const { value = ' ' } = this.props;
    const disabled = value !== ' ';
    const classes = ``;

    return (
      <Button
        className={classes}
        disabled={disabled}
        onClick={this.handleClick}
      >
        {value}
      </Button>
    );
  }
}
