import prevalMacro from 'preval.macro';

import React from 'react'; // tslint:disable-line import-name

import { ProjectList } from './components/ProjectList';

// const value = prevalMacro<String>`module.exports = 'hello macro'`;
// const alertHi = () => alert('hi');

type Props = {};

export const App: React.SFC<Props> = ({}) => (
  <div>
    <ProjectList />
  </div>
);
