import React from 'react';

interface Check {
  check: boolean;
  message: string;
}

const checks: Check[] = [
  {
    check:
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost'),
    message: 'serviceWorker not supported',
  },
  {
    check: 'caches' in self,
    message: 'browser cache not supported',
  },
];

const allSupported = checks.reduce((all, { check }) => all && check, true);

export const CapabilitiesCheck: React.FunctionComponent<{}> = ({
  children,
}) => {
  if (allSupported) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <div>
      <h1>Please upgrade your browser</h1>
      <ul>
        {checks
          .filter(({ check }) => !check)
          .map(({ message }) => (
            <li key={message}>{message}</li>
          ))}
      </ul>
    </div>
  );
};
