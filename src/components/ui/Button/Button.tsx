import styled from '@emotion/styled';

export const Button = styled.button<{ bordered?: boolean }>`
  color: turquoise;
  border: ${({ bordered }) => (bordered ? '2px solid green' : undefined)};
`;
