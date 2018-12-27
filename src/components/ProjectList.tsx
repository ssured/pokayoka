import React, { useState, useContext } from 'react';
import { StoreContext } from '../store';
import {
  IProject,
  isProject,
  BasicForm as ProjectForm,
} from '../models/Project';
import { IPlan, BasicForm as PlanForm } from '../models/Plan';
import { observer } from 'mobx-react-lite';

// export const Button = styled.button<{ bordered?: boolean }>`
//   color: turquoise;
//   border: ${({ bordered }) => (bordered ? '2px solid green' : undefined)};
// `;

import { Box, Flex, Heading, Button, Card } from './base';

// const Box = styled.div<
//   SpaceProps & FlexProps & BorderProps & BorderColorProps
// >`${space} ${flex} ${border} ${borderColor}`;

// const Heading = styled.h1<SpaceProps>`
//   ${space}
// `;

type PlanProps = { plan: IPlan; children?: JSX.Element };
export const Plan = observer(({ plan, children }: PlanProps) => (
  <Box>
    <Flex p={1}>
      <Heading>
        Plan {plan.name} ({plan._id}@{plan._rev})
      </Heading>

      {children && (
        <>
          <Box mx="auto" />
          <Box>{children}</Box>
        </>
      )}
    </Flex>

    <PlanForm plan={plan} />
  </Box>
));

type ProjectProps = { project: IProject };
export const Project = observer(({ project }: ProjectProps) => {
  return (
    <Flex m={2} p={2} flexDirection={'column'}>
      <Heading>
        Project {project.name} ({project._id}@{project._rev})
      </Heading>

      <ProjectForm project={project} />

      {project.currentPlans.map(plan => (
        <Card
          key={plan._id}
          width={1}
          p={3}
          my={3}
          bg="#f6f6ff"
          borderRadius={8}
          boxShadow="0 2px 16px rgba(0, 0, 0, 0.25)"
        >
          <Plan plan={plan}>
            <Button onClick={() => project.removePlan(plan)}>
              Remove from project
            </Button>
          </Plan>
        </Card>
      ))}

      <Button onClick={() => project.addPlan()}>Add Plan</Button>
    </Flex>
  );
});

type Props = {};
export const ProjectList = observer(({  }: Props) => {
  // const [count, setCount] = useState<number>(0);

  const store = useContext(StoreContext);

  return (
    <Box>
      {/* <h1>Project {count}</h1>
      <Button bordered={true} onClick={() => console.log(setCount(count + 1))}>
        +1
      </Button>
      <Box>{store.shared.size}</Box> */}
      <Box>
        {Array.from(store.shared.values()).map(object => {
          if (isProject(object)) {
            return <Project key={object._id} project={object} />;
          }
          return null;
        })}
      </Box>
    </Box>
  );
});
