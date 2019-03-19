import React from 'react';
import { IObservation } from '../../models/Observation';
import { useObserver } from 'mobx-react-lite';
import { Heading } from 'grommet';
import { Task } from './Task';

export const Observation: React.SFC<{ observation: IObservation }> = ({
  observation,
}) =>
  useObserver(() => (
    <>
      <Heading level="3">
        Observation: {observation.title}{' '}
        {observation.tasks.value && observation.tasks.value.length}
      </Heading>
      {observation.images.size > 0 && (
        <img src={[...observation.images.values()][0].src} width={100} />
      )}
      {observation.tasks.value &&
        observation.tasks.value.length > 0 &&
        observation.tasks.value.map(task => <Task key={task.id} task={task} />)}
    </>
  ));
