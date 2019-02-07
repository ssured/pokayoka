import { RouteComponentProps, navigate } from '@reach/router';
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { observable } from 'mobx';

// import { Box, Flex, Heading, Text } from '../components/base';
import { useAccount } from '../hooks/index';
import {
  ConnectPouchDB,
  usePouchDB,
  useSync,
  useDoc,
  useAttachment,
} from '../contexts/pouchdb';
import { Box, Image, Text, Anchor, Button } from 'grommet';
// import { NLSfB } from '../components/NLSfB';

import {
  types as t,
  SnapshotIn,
  Instance,
  onSnapshot,
  IAnyModelType,
} from 'mobx-state-tree';
import { OmitStrict } from 'type-zoo/types';
import { useModel } from '../hooks/model';

import { base } from '../models/base';

// const base = t.model('Base', { _id: t.identifier, _rev: t.string });

// VERSION 1
const projectV1Props = {
  title: t.string,
  image: t.model({ prefix: t.string }),
};

const ProjectV1Model = t.model('project', projectV1Props);
type SnapshotInProjectV1 = SnapshotIn<typeof ProjectV1Model>;

function isProjectV1Snapshot(obj: any): obj is SnapshotInProjectV1 {
  return !isProjectV2Snapshot(obj);
}

const toSnapshot1 = (snapshot: SnapshotInProjectV1) => snapshot;

// VERSION 2
const ProjectV2Model = t.model(
  'project',
  ((v1: typeof projectV1Props) => {
    // change: v2 allows for multple images, v1 only 1
    const v2 = {
      ...projectV1Props,
      images: t.array(projectV1Props.image),
    };

    delete v2.image;
    return v2 as OmitStrict<typeof v2, 'image'>;
  })(projectV1Props)
);
type SnapshotInProjectV2 = SnapshotIn<typeof ProjectV2Model>;

function isProjectV2Snapshot(obj: any): obj is SnapshotInProjectV2 {
  return /*!isProjectV3Snapshot(obj) &&*/ Array.isArray(obj.images);
}

const toSnapshot2: (snapshot: AnySnapshot) => SnapshotInProjectV2 = snapshot =>
  isProjectV1Snapshot(snapshot)
    ? {
        ...toSnapshot1(snapshot),
        images: [snapshot.image],
      }
    : snapshot;

// GENERAL IMPLEMENTATION
type AnySnapshot = SnapshotInProjectV1 | SnapshotInProjectV2;
// type CurrentSnapshot = SnapshotInProjectV2;

const Project = t
  .compose(
    'Project',
    base('Project'),
    ProjectV2Model
  )
  .preProcessSnapshot(toSnapshot2 as any);

const ProjectCard: React.FunctionComponent<{}> = ({}) => {
  const { local, remote, name } = usePouchDB();
  const { active } = useSync(local, remote, { doc_ids: [name] });
  const activeDb = active ? remote : local;
  const doc = useModel(
    Project,
    activeDb,
    name
    // , someDataCache[name or id]  // just allow to initialize with cached data, which is always
    // faster than data from PouchDB
  );
  const src = useAttachment(
    activeDb,
    name,
    (doc && doc.images.length > 0 && doc.images[0].prefix) || null
  );

  const [project, setProject] = useState<Instance<typeof Project> | null>(null);
  useLayoutEffect(
    () => {
      const disposers: ((...args: any[]) => any)[] = [];
      // use useLayoutEffect to go as fast as possible, could possibly block UI though
      if (doc == null) return;
      if (project) {
        // project._merge_external_data(doc);
      } else {
        const p = Project.create(doc, {
          db: local,
          my: {
            [Project.name]: {
              my(project: Instance<typeof Project>) {
                return observable({
                  get capTitle() {
                    return project.title.toUpperCase();
                  },
                });
              },
            },
          },
          // en dan in Project.views(self => ({
          //   get my() { const my =  getEnv.my[getType(self).name]
          //   if (typeof my === 'function') return my(self);
          //   }
          // }))
          // en dan in template
          // <p>{project.my.capTitle}</p>
        });
        setProject(p);
        disposers.push(
          onSnapshot(p, snapshot => {
            local.put(snapshot).catch(err => {
              if (err.code === 'CONFLICT') {
                // mergeAndRetry()
              }
              throw err;
            });
          })
        );
      }
      return () => {
        disposers.forEach(disposer => disposer());
        // someDataCache[doc._id] = getSnapshot(project);
        // project.destroy(); // give back memory
      };
    },
    [doc]
  );

  // const p = useObservable({
  //   current: null as Instance<typeof Project> | null,
  //   get capTitle() {
  //     const p = this.current
  //     return p && p.title.toUpperCase();
  //   }
  // })
  // return useObserver(() => <Text>{p.capTitle || '-'}</Text>)

  // const project = useRecord(Project, id);

  return (
    <Box
      pad="large"
      align="center"
      background={{ color: 'light-2', opacity: 'strong' }}
      round
      gap="small"
      onClick={() => navigate(`/${name}`)}
    >
      <Text>{(doc && doc.title) || name}</Text>
      {src && <Image src={src} fit="cover" />}
      <Anchor href="" label="Link" />
      <Button label="Button" onClick={() => {}} />
    </Box>
  );
};

interface HomeParams {}
export const Home = observer((props: RouteComponentProps<HomeParams>) => {
  const account = useAccount();

  return (
    <Box
      direction="row-responsive"
      justify="center"
      align="center"
      pad="xlarge"
      background="dark-2"
      gap="medium"
    >
      {account.loading
        ? 'Loading'
        : account.error
        ? 'Error'
        : account.value.databases.map(database => (
            <Box key={database}>
              <ConnectPouchDB dbname={database}>
                <ProjectCard />
              </ConnectPouchDB>
            </Box>
          ))}
    </Box>
  );
});
