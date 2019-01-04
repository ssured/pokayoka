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

import { UnControlled as CodeMirror } from 'react-codemirror2';

import { Box, Flex, Heading } from '../components/base';
import { Step, StepBullet } from '../models/Step';
import { getSnapshot, Instance } from 'mobx-state-tree';

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
  return (
    <CodeMirror
      value={bullet.markdown}
      options={{
        lineWrapping: true,
        mode: 'markdown',
        viewportMargin: Infinity,
      }}
      editorDidMount={editor => {
        if (bullet === bullet.step.addedBullet) {
          editor.focus();
        }
      }}
      onChange={(editor, data, value) => bullet.setMarkdown(value)}
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
  );
};

interface GuideParams {}

export const Guide = observer((props: RouteComponentProps<GuideParams>) => {
  const [newBullet, setNewBullet] = useState<Instance<
    typeof StepBullet
  > | null>(null);
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return; // dropped outside the list
    step.reorderBullets(result.source.index, result.destination.index);
  };

  return (
    <Flex flexDirection="column">
      <Heading fontSize={[4, 5]}>Stap: {step.title}</Heading>

      <Flex>
        <Flex flexDirection="column" p={1} width={1 / 2}>
          <Box>image</Box>
          <Box>images</Box>
          <pre>
            {JSON.stringify(
              Object.assign({}, { ...getSnapshot(step), '#': undefined }),
              null,
              2
            )}
          </pre>
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
                              ? 'lightgreen'
                              : 'rgba(0,0,0,0.3)'
                          }
                          css={css(
                            {
                              userSelect: 'none',
                              ...provided.draggableProps.style,
                            },
                            cssCodeMirrorAutosize,
                            cssCodeMirrorMarkdownHeight
                          )}
                        >
                          <Box flex="0 0 auto" {...provided.dragHandleProps}>
                            {bullet.markdown} {bullet.sortIndex}
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
    </Flex>
  );
});
