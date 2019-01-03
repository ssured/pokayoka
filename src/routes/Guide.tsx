import { RouteComponentProps } from '@reach/router';
import React, { useState, CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { css } from 'react-emotion';

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';

import { Controlled as CodeMirror } from 'react-codemirror2';

import { Box, Flex, Heading } from '../components/base';

type MDEditorProps = {
  initialValue: string;
  onChange?: (value: string) => void;
};
const MDEditor = ({ initialValue, onChange = s => {} }: MDEditorProps) => {
  const [value, setValue] = useState<string>(initialValue);
  return (
    <CodeMirror
      value={value}
      options={{
        lineWrapping: true,
        mode: 'markdown',
        viewportMargin: Infinity,
      }}
      onBeforeChange={(editor, data, value) => {
        setValue(value);
      }}
      onChange={(editor, data, value) => onChange(value)}
    />
  );
};

// fake data generator
const getItems = (count: number) =>
  Array.from({ length: count }, (v, k) => k).map(k => ({
    id: `item-${k}`,
    content: `item ${k}`,
  }));

// a little function to help us with reordering the result
const reorder = function<T>(
  list: Iterable<T>,
  startIndex: number,
  endIndex: number
) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

interface GuideParams {}

export const Guide = observer((props: RouteComponentProps<GuideParams>) => {
  const [items, setItems] = useState(getItems(10));

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) return;

    setItems(reorder(items, result.source.index, result.destination.index));
  };

  return (
    <Flex flexDirection="column">
      <Heading fontSize={[4, 5]}>Guide</Heading>

      <Flex>
        <Flex flexDirection="column" p={1} width={1 / 2}>
          <div>image</div>
          <div>images</div>
        </Flex>
        <Flex flexDirection="column" p={1} width={1 / 2}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable">
              {(provided, snapshot) => (
                <Box
                  innerRef={provided.innerRef}
                  p={1}
                  bg={`rgba(0,0,${snapshot.isDraggingOver ? 255 : 0},0.2)`}
                  css={css`
                    transition: background-color 300ms linear;
                    & > div:last-of-type {
                      margin-bottom: 0;
                    }
                  `}
                >
                  {items.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Flex
                          innerRef={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          p={1}
                          mb={1}
                          bg={
                            snapshot.isDragging
                              ? 'lightgreen'
                              : 'rgba(0,0,0,0.3)'
                          }
                          css={css(
                            {
                              userSelect: 'none',
                              ...provided.draggableProps.style,
                            },
                            css`
                              .CodeMirror {
                                border: 1px solid #eee;
                                height: auto;
                              }
                              .cm-s-default {
                                font-family: Arial, Helvetica, sans-serif;
                              }
                              .cm-header-1 {
                                font-size: 150%;
                              }
                              .cm-header-2 {
                                font-size: 130%;
                              }
                              .cm-header-3 {
                                font-size: 120%;
                              }
                              .cm-header-4 {
                                font-size: 110%;
                              }
                              .cm-header-5 {
                                font-size: 100%;
                              }
                              .cm-header-6 {
                                font-size: 90%;
                              }
                            `
                          )}
                        >
                          <Box flex="0 0 auto">{item.content}</Box>
                          <Box flex="1 1 auto">
                            <MDEditor initialValue={item.content} />
                          </Box>
                        </Flex>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </Flex>
      </Flex>
    </Flex>
  );
});
