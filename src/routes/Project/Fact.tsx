import React from 'react';
import { IFact } from '../../models/Fact';
import { useProjectId } from './index';
import { useObserver } from 'mobx-react-lite';
import { Heading } from 'grommet';

export const Fact: React.SFC<{ fact: IFact }> = ({ fact }) =>
  useObserver(() => (
    <>
      <Heading level="3">Fact: {fact.title}</Heading>
      {fact.images.length > 0 && <img src={fact.images[0].src} />}
    </>
  ));
