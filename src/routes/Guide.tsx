import { RouteComponentProps } from '@reach/router';
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { css } from '@emotion/core';
import Markdown from 'react-markdown';
import { FaGripVertical, FaGripHorizontal } from 'react-icons/fa';

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';

import { Controlled as CodeMirror } from 'react-codemirror2';

import { Box, Flex, Heading } from '../components/base';
import { Step, StepBullet } from '../models/Step';
import { getSnapshot, Instance } from 'mobx-state-tree';
import { RatioBox } from '../components/elements/Box';
import { ColorPicker } from '../components/elements/Dot';

const cssCodeMirrorAutosize = css`
  .CodeMirror {
    border: 1px solid #eee;
    height: auto;
  }
`;

const cssCodeMirrorMarkdownHeight = css`
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
`;

const step = Step.create({
  _id: 'step',
  title: 'Voorbeeld',
  bullets_: {
    '1': {
      id: '1',
      sortIndex: 1,
      markdown: '# Regel 1',
    },
    '2': {
      id: '2',
      sortIndex: 2,
      markdown: 'Regel 2',
    },
    '3': {
      id: '3',
      sortIndex: 3,
      markdown: 'Regel 3',
    },
  },
  images_: {
    i1: {
      id: 'i1',
      sortIndex: 1,
      image:
        'https://images.unsplash.com/photo-1482731215275-a1f151646268?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1024&q=80',
    },
    i2: {
      id: 'i2',
      sortIndex: 2,
      image:
        'https://images.unsplash.com/photo-1503708928676-1cb796a0891e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1024&q=80',
    },
    i3: {
      id: 'i3',
      sortIndex: 3,
      image:
        'https://images.unsplash.com/photo-1497897271578-5f45bb7a8400?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1024&q=80',
    },
    i4: {
      id: 'i4',
      sortIndex: 4,
      image:
        'https://images.unsplash.com/photo-1523182009640-130ccf847b03?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1024&q=80',
    },
  },
});

type BulletEditorProps = { bullet: Instance<typeof StepBullet> };
const BulletEditor: React.SFC<BulletEditorProps> = ({ bullet }) => {
  const [value, setValue] = useState<string>(bullet.markdown);
  const [isEditing, setIsEditing] = useState<boolean>(
    bullet === bullet.step.addedBullet
  );

  return isEditing ? (
    <CodeMirror
      value={value}
      options={{
        lineWrapping: true,
        mode: 'markdown',
        viewportMargin: Infinity,
      }}
      editorDidMount={editor => editor.focus()}
      onBeforeChange={(editor, data, value) => {
        setValue(value);
      }}
      onChange={(editor, data, value) => bullet.setMarkdown(value)}
      onBlur={() => setIsEditing(false)}
      onKeyDown={(editor, event) => {
        const keyEvent = (event as unknown) as KeyboardEvent;
        if (keyEvent.keyCode === 13 && !keyEvent.shiftKey) {
          const index = bullet.step.bullets.indexOf(bullet);
          if (index === -1) return;
          bullet.step.addBullet(index + 1, ``);
          event.preventDefault();
        }
      }}
    />
  ) : (
    <Box
      onClick={() => setIsEditing(true)}
      css={css`
        > *:first-of-type {
          margin-top: 0;
        }
        > *:last-of-type {
          margin-bottom: 0;
        }
      `}
    >
      <Markdown source={bullet.markdown} />
    </Box>
  );
};

interface SortableImagesParams {}
export const SortableImages = observer(
  (props: RouteComponentProps<SortableImagesParams>) => {
    const onDragImageEnd = (result: DropResult) => {
      if (!result.destination) return; // dropped outside the list
      step.reorderImages(result.source.index, result.destination.index);
    };
    return (
      <DragDropContext onDragEnd={onDragImageEnd}>
        <Droppable droppableId="droppable" direction="horizontal">
          {(provided, snapshot) => (
            <Flex
              ref={provided.innerRef}
              bg={snapshot.isDraggingOver ? `rgba(0,255,0,0.1)` : undefined}
              css={css`
                overflow: scroll;
                & > div {
                  flex: 0 0 auto;
                }
              `}
              {...provided.droppableProps}
            >
              {step.images.map((image, index) => (
                <Draggable key={image.id} draggableId={image.id} index={index}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      width={1 / 3}
                      p={2}
                      m={0}
                      bg={
                        snapshot.isDragging
                          ? 'rgba(0,0,0,0.2)'
                          : 'rgba(0,0,0,0.05)'
                      }
                      css={css({
                        userSelect: 'none',
                        ...provided.draggableProps.style,
                      })}
                    >
                      <RatioBox
                        image={image.image}
                        border="1px solid"
                        borderColor="blue"
                        p={1}
                      >
                        <Box
                          css={css`
                            display: inline-block;
                          `}
                          {...provided.dragHandleProps}
                        >
                          <FaGripHorizontal />
                        </Box>
                        {/* <h1>{image.id}+</h1> */}
                      </RatioBox>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {/* fixes jittering when dragging to end of list */}
              <Box width={'1px'} p={0} m={0} />
            </Flex>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
);

interface GuideParams {}

export const Guide = observer((props: RouteComponentProps<GuideParams>) => {
  const onDragBulletEnd = (result: DropResult) => {
    if (!result.destination) return; // dropped outside the list
    step.reorderBullets(result.source.index, result.destination.index);
  };

  const onDragImageEnd = (result: DropResult) => {
    if (!result.destination) return; // dropped outside the list
    step.reorderImages(result.source.index, result.destination.index);
  };

  return (
    <Flex flexDirection="column">
      <Heading fontSize={[4, 5]}>Stap: {step.title}</Heading>

      <Flex>
        <Flex flexDirection="column" p={1} width={1 / 2}>
          <Box p={1}>
            <RatioBox
              image="https://cdn4.iconfinder.com/data/icons/social-communication/142/add_photo-512.png"
              border="1px solid"
              borderColor="blue"
              p={1}
            />
          </Box>
          <Box p={1}>
            <SortableImages />
          </Box>
        </Flex>
        <Flex flexDirection="column" p={1} width={1 / 2}>
          <DragDropContext onDragEnd={onDragBulletEnd}>
            <Droppable droppableId="droppable">
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  p={1}
                  bg={snapshot.isDraggingOver ? `rgba(0,255,0,0.1)` : undefined}
                  css={css`
                    transition: background-color 100ms linear;
                    & > div:last-of-type {
                      margin-bottom: 0;
                    }
                  `}
                  {...provided.droppableProps}
                >
                  {step.bullets.map((bullet, index) => (
                    <Draggable
                      key={bullet.id}
                      draggableId={bullet.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Flex
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          p={1}
                          mb={1}
                          bg={
                            snapshot.isDragging
                              ? 'rgba(0,0,0,0.2)'
                              : 'rgba(0,0,0,0.05)'
                          }
                          css={css(
                            {
                              userSelect: 'none',
                              ...provided.draggableProps.style,
                            },
                            cssCodeMirrorAutosize,
                            cssCodeMirrorMarkdownHeight
                          )}
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Box flex="0 0 auto" {...provided.dragHandleProps}>
                            <FaGripVertical />

                            <ColorPicker
                              color={bullet.color || 'black'}
                              setColor={bullet.setColor}
                              colors={[
                                'black',
                                'red',
                                'orange',
                                'yellow',
                                'green',
                                'blue',
                                'purple',
                              ]}
                            />
                          </Box>
                          <Box flex="1 1 auto">
                            <BulletEditor bullet={bullet} />
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
      <pre>
        {JSON.stringify(
          Object.assign({}, { ...getSnapshot(step), '#': undefined }),
          null,
          2
        )}
      </pre>
    </Flex>
  );
});
