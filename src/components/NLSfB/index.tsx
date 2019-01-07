import React, { useState } from 'react';
import styled from '@emotion/styled';

import { tabel1 as nlsfb, NLSfBElement, NLSfBSubCategorie } from './nlsfb';

import { Box, Flex, Text, Image, Button, Card, Heading } from '../base';

const CardContent = styled(Box)<{}>``;
const CardHeader = styled(Box)<{}>``;
const CardDescription = styled(Box)<{}>``;
const CardGroup = styled(Box)<{}>``;

const Grid = styled(Flex)<{}>``;
const GridColumn = styled(Flex)<{}>``;

const List = styled(Box)<{}>``;
const ListItem = styled(Box)<{}>``;
const ListContent = styled(Box)<{}>``;
const ListHeader = Heading;

// https://rebassjs.org/Flex
const Step = styled(Flex)<{ active: boolean }>`
  background-color: ${({ active }) => (active ? 'red' : undefined)};
`;
const StepGroup = styled(Flex)<{}>`
  border: 1px solid red;
`;
const StepContent = styled(Flex)<{}>``;
const StepTitle = styled(Box)<{}>``;

const Segment = styled(Box)<{}>``;
const Icon = Text;

const ElementCard: React.FunctionComponent<{
  elementId: string;
  element: NLSfBElement;
  onClick?: () => void;
}> = ({ elementId, element, ...props }) => (
  <Card {...props}>
    <Image src={element.image} />
    <Box>
      <Text p={1}>
        {elementId} {element.naam}
      </Text>
      <CardDescription>{element.omschrijving}</CardDescription>
    </Box>
  </Card>
);

const SubGroupCard: React.FunctionComponent<{
  groupId: string;
  subGroupId: string;
  subGroup: NLSfBSubCategorie;
  onClick?: () => void;
}> = ({ groupId = '-', subGroupId, subGroup, ...props }) => (
  <Card {...props}>
    <Image src={subGroup.image} />
    <CardContent>
      <CardHeader>
        ({groupId}
        {subGroupId}){' '}
        {subGroup.naam === '-' && Object.values(subGroup.elementen).length === 1
          ? Object.values(subGroup.elementen)[0].naam
          : subGroup.naam}
      </CardHeader>
      {Object.values(subGroup.elementen).length > 1 && (
        <CardDescription>
          {[...Object.entries(subGroup.elementen)]
            .map(([elementId, element]) => `.${elementId}= ${element.naam}`)
            .join(', ')}
        </CardDescription>
      )}
    </CardContent>
  </Card>
);

export const NLSfB: React.FunctionComponent<{}> = () => {
  const [groupId, _setGroup] = useState<string | null>(null);
  const [subGroupId, _setSubGroup] = useState<string | null>(null);
  const [elementId, _setElement] = useState<string | null>(null);
  const [variantId, _setVariant] = useState<string | null>(null);

  const setVariant = (value: string | null) => {
    _setVariant(value === variantId ? null : value);
  };

  const setElement = (value: string | null) => {
    _setElement(value === elementId ? null : value);
    setVariant(null);
  };
  const setSubGroup = (value: string | null) => {
    _setSubGroup(value === subGroupId ? null : value);
    setElement(
      group &&
        value &&
        value !== subGroupId &&
        Object.keys(group.sub[value].elementen).length === 1
        ? Object.keys(group.sub[value].elementen)[0]
        : null
    );
  };
  const setGroup = (value: string | null) => {
    _setGroup(value === groupId ? null : value);
    setSubGroup(
      value && value !== groupId && Object.keys(nlsfb[value].sub).length === 1
        ? Object.keys(nlsfb[value].sub)[0]
        : null
    );
  };

  // const goBack = () => {
  //   if (elementId != null) return setElement(null);
  //   if (subGroupId != null) return setSubGroup(null);
  //   if (groupId != null) return setGroup(null);
  // };

  const group = groupId == null ? null : nlsfb[groupId];
  const subGroup =
    group == null || subGroupId == null ? null : group.sub[subGroupId];
  const element =
    subGroup == null || elementId == null
      ? null
      : subGroup.elementen[elementId];
  const variant =
    element == null || variantId == null ? null : element.varianten[variantId];

  return (
    <>
      <StepGroup attached="top">
        <Step onClick={() => setGroup(null)}>
          <StepContent>
            <StepTitle>
              ({groupId || '-'}
              {subGroupId || '-'}
              {elementId ? `.${elementId}${variantId || ''}` : ''})
            </StepTitle>
            {/* <Step.Description>NL/SfB</Step.Description> */}
          </StepContent>
        </Step>
        {group == null ? (
          <Step active={true}>
            <StepContent>
              <StepTitle>Categorie</StepTitle>
              {/* <Step.Description>Kies categorie</Step.Description> */}
            </StepContent>
          </Step>
        ) : (
          <Step onClick={() => setSubGroup(null)}>
            <Image
              src={group.image}
              size="mini"
              style={{ marginRight: '1em' }}
            />
            <StepContent>
              <StepTitle>{group.naam}</StepTitle>
            </StepContent>
          </Step>
        )}

        {subGroup == null ? (
          <Step active={group != null} disabled={group == null}>
            <StepContent>
              <StepTitle>Groep</StepTitle>
              {/* <Step.Description>Kies groep</Step.Description> */}
            </StepContent>
          </Step>
        ) : (
          <Step onClick={() => setElement(null)}>
            <Image
              src={subGroup.image}
              size="mini"
              style={{ marginRight: '1em' }}
            />
            <StepContent>
              <StepTitle>{subGroup.naam}</StepTitle>
            </StepContent>
          </Step>
        )}

        {element == null ? (
          <Step active={subGroup != null} disabled={subGroup == null}>
            <StepContent>
              <StepTitle>Element</StepTitle>
              {/* <Step.Description>Kies element</Step.Description> */}
            </StepContent>
          </Step>
        ) : (
          <Step onClick={() => setVariant(null)}>
            <Image
              src={element.image}
              size="mini"
              style={{ marginRight: '1em' }}
            />
            <StepContent>
              <StepTitle>
                {element.naam}
                {variant && `, ${variant}`}
              </StepTitle>
            </StepContent>
          </Step>
        )}
      </StepGroup>

      <Segment>
        {group == null ? (
          <Flex flexWrap={true}>
            {Array.from(Object.entries(nlsfb)).map(([groupId, group]) => (
              <Card m={2} p={2} key={groupId} onClick={() => setGroup(groupId)}>
                <Image src={group.image} />
                <CardContent>
                  <CardHeader>
                    ({groupId}
                    -) {group.naam}
                  </CardHeader>
                </CardContent>
              </Card>
            ))}
          </Flex>
        ) : subGroup == null ? (
          <CardGroup>
            {groupId &&
              Array.from(Object.entries(nlsfb[groupId].sub)).map(
                ([subGroupId, subGroup]) => (
                  <SubGroupCard
                    key={subGroupId}
                    groupId={groupId}
                    subGroupId={subGroupId}
                    subGroup={subGroup}
                    onClick={() => setSubGroup(subGroupId)}
                  />
                )
              )}
          </CardGroup>
        ) : element == null ? (
          <CardGroup>
            {groupId &&
              subGroupId &&
              Array.from(
                Object.entries(nlsfb[groupId].sub[subGroupId].elementen)
              ).map(([elementId, element]) => (
                <ElementCard
                  key={elementId}
                  elementId={elementId}
                  element={element}
                  onClick={() => setElement(elementId)}
                />
              ))}
          </CardGroup>
        ) : (
          <Grid columns={element.varianten ? 3 : 2}>
            <GridColumn>
              {elementId && (
                <ElementCard elementId={elementId} element={element} />
              )}
            </GridColumn>
            <GridColumn>
              <List
                size="large"
                relaxed="very"
                verticalAlign="middle"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                <ListItem>
                  <ListContent>
                    <ListHeader>Functie</ListHeader>
                    <ListContent>{element.functie}</ListContent>
                  </ListContent>
                </ListItem>
                <ListItem>
                  <ListContent>
                    <ListHeader>Inbegrepen</ListHeader>
                    <ListContent>{element.inbegrepen}</ListContent>
                  </ListContent>
                </ListItem>
                <ListItem>
                  <ListContent>
                    <ListHeader>Uitgezonderd</ListHeader>
                    <ListContent>{element.uitgezonderd}</ListContent>
                  </ListContent>
                </ListItem>
                <ListItem>
                  <ListContent>
                    <ListHeader>Meeteenheid</ListHeader>
                    <ListContent>{element.meeteenheid}</ListContent>
                  </ListContent>
                </ListItem>
              </List>
            </GridColumn>
            {element.varianten && (
              <GridColumn>
                <List
                  divided={true}
                  size="large"
                  relaxed="very"
                  selection={true}
                  verticalAlign="middle"
                >
                  <ListItem
                    onClick={() => setVariant(null)}
                    active={variant == null}
                  >
                    <ListContent>
                      <ListHeader>
                        {variant == null && <Icon name="arrow right" />}
                        <Button>
                          ({groupId}
                          {subGroupId}.{elementId})
                        </Button>
                        {element.naam}
                      </ListHeader>
                    </ListContent>
                  </ListItem>
                  {Array.from(Object.entries(element.varianten)).map(
                    ([variantId, naam]) => (
                      <ListItem
                        key={variantId}
                        onClick={() => setVariant(variantId)}
                        active={variant === naam}
                      >
                        <ListContent>
                          <ListHeader>
                            {variant === naam && <Icon name="arrow right" />}
                            <Button>
                              ({groupId}
                              {subGroupId}.{elementId}
                              {variantId})
                            </Button>
                            {naam}
                          </ListHeader>
                        </ListContent>
                      </ListItem>
                    )
                  )}
                </List>
              </GridColumn>
            )}
          </Grid>
        )}
      </Segment>
    </>
  );
};
