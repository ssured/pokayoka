// import React from 'react' // tslint:disable-line import-name
import styled from "react-emotion"; // tslint:disable-line import-name

export const Button = styled.button<{ bordered?: boolean }>`
  color: turquoise;
  border: ${({ bordered }) => (bordered ? "2px solid green" : undefined)};
`;
