import React from 'react';
import { IObservation } from '../../models/Observation';
import { useObserver } from 'mobx-react-lite';
import { Heading } from 'grommet';

export const Observation: React.SFC<{ observation: IObservation }> = ({
  observation,
}) =>
  useObserver(() => (
    <>
      <Heading level="3">Fact: {observation.title}</Heading>
      {observation.images.length > 0 && <img src={observation.images[0].src} />}
    </>
  ));
