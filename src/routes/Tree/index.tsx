import { RouteComponentProps } from '@reach/router';
import React, { ChangeEvent } from 'react';

import { observer, useObservable } from 'mobx-react-lite';
import {
  Box,
  Text,
  Accordion,
  AccordionPanel,
  FormField,
  TextArea,
  TextInput,
  Button,
  Form,
  Heading,
} from 'grommet';
import { runInAction, action } from 'mobx';

const Project: React.FunctionComponent<{}> = ({ children }) => {
  return <div>{children}</div>;
};

const Site: React.FunctionComponent<{}> = ({ children }) => {
  return <div>{children}</div>;
};

function activeInactive<H, C>({
  Header,
  Content,
}: {
  Header: React.FunctionComponent<H>;
  Content: React.FunctionComponent<C>;
}): React.FunctionComponent<H & C> {
  return ({}) => (
    <Box>
      <Header />
      <Content />
    </Box>
  );
}

/***
 * Statussen voor regel
 *  - Header
 *  - Edit = hele vak is een form
 *      kan worden geplaatst in box of als content van accordeon
 *  - Content = content als regel in een accordeon uitgeklapt is
 */

export const Tree: React.FunctionComponent<
  RouteComponentProps<{}> & {}
> = observer(({}) => {
  const s = useObservable({
    activeIndex: 0,
    onAccordeonActiveIndexes: action((indexes: number[]) => {
      s.activeIndex = indexes[0];
    }),
  });

  const project = useObservable({
    code: '',
    naam: '',
    plaats: '',
    setCode: action((event: ChangeEvent<HTMLInputElement>) => {
      project.code = event.target.value;
    }),
  });

  return (
    <Box justify="center">
      <Form
        onSubmit={({ value }) => {
          console.log(value);
        }}
        value={{ name: 'test' }}
      >
        <Heading level="1" textAlign="center">
          Maak nieuw project aan
        </Heading>

        <Box direction="row" justify="center" gap="medium">
          <FormField label="Interne code" name="code" required />
          <FormField label="Projectnaam" name="name" required />
          <FormField label="Plaats" name="city" required />
        </Box>

        <Box direction="row" justify="evenly" margin={{ top: 'medium' }}>
          <Button label="Terug" />
          <Box />
          <Button type="submit" label="Volgende" primary />
        </Box>
      </Form>

      {/* <Accordion
        animate
        multiple={false}
        margin="small"
        activeIndex={s.activeIndex}
        onActive={s.onAccordeonActiveIndexes}
      >
        <AccordionPanel label={<Project>Kruisakker 15 Rolde</Project>}>
          <Box background="light-1">
            <Text>LEAFLET MET KAART POSITIE ROLDE HIER</Text>
          </Box>
        </AccordionPanel>
        <AccordionPanel label="Panel 2">
          <Box height="small" background="light-1">
            Panel 2 content
          </Box>
        </AccordionPanel>
        <AccordionPanel label="Panel 3">
          <Box height="medium" background="light-1">
            Panel 3 content
          </Box>
        </AccordionPanel>
      </Accordion> */}
    </Box>
  );
});
