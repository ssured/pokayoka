import React from 'react';
import { ITask } from '../../models/Task';
import { useObserver } from 'mobx-react-lite';
import { Heading } from 'grommet';

export const Task: React.SFC<{ task: ITask }> = ({ task }) =>
  useObserver(() => (
    <>
      <Heading level="3">Task: {task.name}</Heading>
      <ul>
        {task.chainOfCommand.map(assignment => (
          <li key={assignment.key}>
            {assignment.person} {assignment.progress}%
          </li>
        ))}
      </ul>
    </>
  ));
