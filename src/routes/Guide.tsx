import { RouteComponentProps } from '@reach/router';
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { css } from 'react-emotion';
import Markdown from 'react-markdown';
import { FaGripVertical } from 'react-icons/fa';

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
import { Dot } from '../components/elements/Dot/Dot';
import { RatioBox } from '../components/elements/RatioBox/index';

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

interface GuideParams {}

export const Guide = observer((props: RouteComponentProps<GuideParams>) => {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return; // dropped outside the list
    step.reorderBullets(result.source.index, result.destination.index);
  };

  return (
    <Flex flexDirection="column">
      <Heading fontSize={[4, 5]}>Stap: {step.title}</Heading>

      <Flex>
        <Flex flexDirection="column" p={1} width={1 / 2}>
          <Box width={1} p={1}>
            <RatioBox
              image="https://cdn4.iconfinder.com/data/icons/social-communication/142/add_photo-512.png"
              border="1px solid"
              borderColor="blue"
              p={1}
            />
          </Box>
          <Flex
            width={1}
            flexWrap="nowrap"
            css={css`
              overflow-x: scroll;
            `}
          >
            <Box width={1 / 3} p={1} flex="0 0 auto">
              <RatioBox
                image="https://cdn4.iconfinder.com/data/icons/social-communication/142/add_photo-512.png"
                border="1px solid"
                borderColor="blue"
                p={1}
              />
            </Box>
            <Box width={1 / 3} p={1} flex="0 0 auto">
              <RatioBox
                image="https://cdn4.iconfinder.com/data/icons/social-communication/142/add_photo-512.png"
                border="1px solid"
                borderColor="blue"
                p={1}
              />
            </Box>
            <Box width={1 / 3} p={1} flex="0 0 auto">
              <RatioBox
                image="https://cdn4.iconfinder.com/data/icons/social-communication/142/add_photo-512.png"
                border="1px solid"
                borderColor="blue"
                p={1}
              />
            </Box>
            <Box width={1 / 3} p={1} flex="0 0 auto">
              <RatioBox
                image="https://cdn4.iconfinder.com/data/icons/social-communication/142/add_photo-512.png"
                border="1px solid"
                borderColor="blue"
                p={1}
              />
            </Box>
          </Flex>
        </Flex>
        <Flex flexDirection="column" p={1} width={1 / 2}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable">
              {(provided, snapshot) => (
                <Box
                  innerRef={provided.innerRef}
                  p={1}
                  bg={snapshot.isDraggingOver ? `rgba(0,255,0,0.2)` : undefined}
                  css={css`
                    transition: background-color 300ms linear;
                    & > div:last-of-type {
                      margin-bottom: 0;
                    }
                  `}
                >
                  {step.bullets.map((bullet, index) => (
                    <Draggable
                      key={bullet.id}
                      draggableId={bullet.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Flex
                          innerRef={provided.innerRef}
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
                            <Dot bg={bullet.color || 'black'} />
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
