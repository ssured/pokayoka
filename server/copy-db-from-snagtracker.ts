import { File } from '../src/models/base';
import { Project, IProject } from '../src/models/Project';
import { Site, ISite } from '../src/models/Site';
import { Building, IBuilding } from '../src/models/Building';
import { BuildingStorey, IBuildingStorey } from '../src/models/BuildingStorey';
import { Sheet, ISheet } from '../src/models/Sheet';
import { Space, ISpace } from '../src/models/Space';
import { Observation, IObservation } from '../src/models/Observation';
import { Person, IPerson } from '../src/models/Person';
import { Task, ITask } from '../src/models/Task';
import debug from 'debug';
import nano from 'nano';
import { generateId } from '../src/utils/id';
import { getSnapshot, SnapshotIn } from 'mobx-state-tree';
import crypto from 'crypto';
import PQueue from 'p-queue';
import fs from 'fs-extra';
import path from 'path';
import mime from 'mime';
import { ObjectStorage } from '../src/storage/object';

const log = /*debug(__filename.replace(`${__dirname}/`, '').replace('.ts', ''));
log.log = */ console.log.bind(
  console
);

export async function copyDbFromSnagtracker(
  fromDb: nano.DocumentScope<{
    title: string;
    description: string;
    _attachments: any;
  }>,
  toDb: ObjectStorage,
  toCdnPath: string // pathForCdn(toDbName)
) {
  // const fromDbName = 'bk0wb0a7sz';
  // const toDbName = fromDbName;
  // const server = nano('http://admin:admin@localhost:5984');

  type AttachmentInfo = {
    name: string;
    content_type: string;
    revpos: number;
    digest: string;
    length: number;
    stub: boolean;
  };

  function sha256OfStream(
    streamThunk: () => NodeJS.ReadStream,
    fileInfo: AttachmentInfo
  ): Promise<string> {
    return new Promise<string>(async res => {
      const sha256 = await new Promise<string>((resolve, reject) =>
        streamThunk()
          .on('error', reject)
          .pipe(crypto.createHash('sha256').setEncoding('hex'))
          .once('finish', function(this: any) {
            resolve(this.read());
          })
      );

      const filename = `${sha256}.${mime.getExtension(fileInfo.content_type)}`;
      const target = path.join(toCdnPath, filename);

      try {
        await fs.stat(target);
        res(filename);
      } catch (e) {
        streamThunk()
          .pipe(fs.createWriteStream(target))
          .on('close', () => res(filename));
      }
    });
  }

  function attachmentsToMap(attachments: { [key: string]: any }) {
    return Object.keys(attachments || {}).reduce(
      (map, name) => {
        map[name] = { sha256: `$${name}`, name };
        return map;
      },
      {} as { [key: string]: SnapshotIn<ReturnType<typeof File>> }
    );
  }

  try {
    // old to new
    const idMap: { [key: string]: string } = {};
    const sheetIdMap: { [key: string]: string } = {};

    // try {
    //   await server.db.destroy(toDbName);
    // } catch (e) {}
    // await server.db.create(toDbName);

    const allRows = (await fromDb.list({ include_docs: true })).rows;

    const ids = allRows.map(row => row.id);
    const nonLeafIds = ids.filter(
      id => !!ids.find(childId => childId.indexOf(`${id}_`) > -1)
    );
    const nonLeafRows = allRows.filter(row => nonLeafIds.includes(row.id));

    const projects = nonLeafRows
      .filter(row => parts(row.id).length === 1)
      .map(row => row.doc!);

    const newObjects = new Map<
      | IProject
      | ISite
      | IBuilding
      | IBuildingStorey
      | ISpace
      | ISheet
      | IObservation
      | ITask
      | IPerson,
      string
    >();

    projects.forEach(project => {
      const projectId = newIdFromOldId(project._id); // generateId();
      const newProject = Project().create({
        id: projectId,
        globalId: projectId,
        name: project.title,
        files: attachmentsToMap(project._attachments),
      });
      newObjects.set(newProject, project._id);

      const siteId = newIdFromOldId(project._id, 'site');
      const newSite = Site().create({
        id: siteId,
        globalId: siteId,
        name: project.title,
        project: projectId,
      });
      newObjects.set(newSite, project._id);

      const buildingId = newIdFromOldId(project._id, 'building');
      const newBuilding = Building().create({
        id: buildingId,
        globalId: buildingId,
        name: project.title,
        description: project.description,
        files: attachmentsToMap(project._attachments),
        site: siteId,
      });
      newObjects.set(newBuilding, project._id);
      idMap[project._id] = buildingId;

      const storeys = nonLeafRows
        .filter(
          row => parts(row.id)[0] === project._id && parts(row.id).length === 2
        )
        .map(row => row.doc!);

      storeys.forEach(storey => {
        const storeyId = newIdFromOldId(storey._id, 'storey');
        const newStorey = BuildingStorey().create({
          id: storeyId,
          globalId: storeyId,
          name: storey.title || '-- left blank --',
          description: storey.description,
          files: attachmentsToMap(storey._attachments),
          building: buildingId,
        });
        newObjects.set(newStorey, storey._id);
        idMap[storey._id] = storeyId;

        const sheetId = newIdFromOldId(storey._id, 'sheet');
        const newSheet = Sheet().create({
          id: sheetId,
          tiles: attachmentsToMap(storey._attachments),
          spatialStructure: storeyId,
        });
        newObjects.set(newSheet, storey._id);
        sheetIdMap[storey._id] = sheetId;

        const spaces = nonLeafRows
          .filter(
            row =>
              parts(row.id)[0] === project._id &&
              parts(row.id)[1] === parts(storey._id)[1] &&
              parts(row.id).length === 3
          )
          .map(row => row.doc!);

        spaces.forEach(space => {
          const id = newIdFromOldId(space._id, 'space');
          const newSpace = Space().create({
            id,
            globalId: id,
            name: space.title || '-- left blank --',
            description: space.description,
            files: attachmentsToMap(space._attachments),
            buildingStorey: storeyId,
          });
          newObjects.set(newSpace, space._id);
          idMap[space._id] = id;
        });
      });
    });

    const queue = new PQueue({ concurrency: 5 });

    for (const [object, originalId] of newObjects.entries()) {
      const snapshot = getSnapshot(object);
      let snapshotString = JSON.stringify(snapshot);

      const fileHashes = await Promise.all(
        Object.entries(
          (
            allRows.find(row => row.id === originalId) || {
              doc: { _attachments: {} },
            }
          ).doc!._attachments || {}
        ).reduce(
          (hashes, [filename, fileinfo]) => {
            hashes.push(
              queue
                .add(
                  () =>
                    sha256OfStream(
                      (() =>
                        fromDb.attachment.getAsStream(
                          originalId,
                          filename
                        )) as any,
                      {
                        ...fileinfo,
                        name: filename,
                      } as AttachmentInfo
                    ) as any
                )
                .then((sha: string) => [filename, sha] as [string, string])
            );
            return hashes;
          },
          [] as Promise<[string, string]>[]
        )
      );

      for (const [filename, sha] of fileHashes) {
        let newString = snapshotString.replace(`$${filename}`, sha);
        while (newString !== snapshotString) {
          snapshotString = newString;
          newString = snapshotString.replace(`$${filename}`, sha);
        }
      }

      const newSnapshot = JSON.parse(snapshotString);

      toDb.slowlyMergeObject(newSnapshot);
      log(`Write ${newSnapshot.id} ${newSnapshot.type}`);
    }
    await toDb.commit();
    log('Writing tree objects done');

    const foundIds = [...newObjects.values()];
    const snagIds = ids
      .filter(id => !foundIds.find(fid => fid === id))
      .filter(id => id[0] !== '_');
    // .filter(id => id.indexOf('task$') > -1);

    snagIds.forEach(async snagId => {
      const row = allRows.find(row => row.id === snagId);
      if (row == null) {
        throw new Error('row not found');
      }

      const { _id, _rev, _attachments, ...doc } = (row.doc as unknown) as {
        _id: string;
        _rev: string;
        _attachments: {
          [key: string]: {
            content_type: string;
            revpos: number;
            digest: string;
            length: number;
            stub: boolean;
          };
        };
        title: string | null;
        description?: string;
        position?: {
          lat: number;
          lng: number;
          zoom?: number;
        };
        images?: {
          geojson?: any;
          fileInfo?: {
            name: string;
            type: string;
            size: number;
            lastModified: number;
          };
          prefix: string;
          width: number;
          height: number;
        }[];
        execution?: { u: string; p?: number }[];
        labels?: string[];
      };

      const fileHashes = await Promise.all(
        Object.entries(_attachments || {}).reduce(
          (hashes, [filename, fileinfo]) => {
            hashes.push(
              queue
                .add(
                  () =>
                    sha256OfStream(
                      (() =>
                        fromDb.attachment.getAsStream(snagId, filename)) as any,
                      {
                        ...fileinfo,
                        name: filename,
                      } as AttachmentInfo
                    ) as any
                )
                .then((sha: string) => [filename, sha] as [string, string])
            );
            return hashes;
          },
          [] as Promise<[string, string]>[]
        )
      );

      const observationId = newIdFromOldId(_id, 'observation');
      const newObservation = Observation().create({
        id: observationId,
        title: doc.title || '-- left blank --',
        description: doc.description,
        labels: (doc.labels || []).reduce(
          (labels, label) => {
            labels[generateId()] = label;
            return labels;
          },
          {} as { [key: string]: string }
        ),
        images:
          (doc.images || []).reduce(
            (images, image) => {
              images[generateId()] = image;
              return images;
            },
            {} as { [key: string]: any }
          ) || {},
        files: attachmentsToMap(_attachments),
        spatialStructure:
          idMap[
            parts(snagId)
              .slice(0, -1)
              .join('_')
          ],
        position: doc.position && {
          sheet:
            sheetIdMap[ // the sheet is usually what is stored at the second level
              parts(snagId) // TODO can be improved by really resolving the sheet belonging to the snag
                .slice(0, 2) // this code will fail for projects with sheets at level 3 or deeper
                .join('_')
            ],
          ...doc.position,
        },
      });

      const taskId = newIdFromOldId(_id, 'task');
      const newTask = Task().create({
        id: taskId,
        name: doc.title || '-- left blank --',
        deliverable: doc.description,
        basedOn: observationId,
        spatialStructure:
          idMap[
            parts(snagId)
              .slice(0, -1)
              .join('_')
          ],
        assignment: (doc.execution || []).reduce(
          (assignment, { u, p }, i, execution) => {
            assignment[generateId()] = {
              person: u,
              progress: p || 0,
              delegatedFrom: i > 0 ? execution[i - 1].u : undefined,
            };
            return assignment;
          },
          {} as {
            [key: string]: {
              person: string;
              progress?: number;
              delegatedFrom?: string;
            };
          }
        ),
        labels: (doc.labels || []).reduce(
          (labels, label) => {
            labels[generateId()] = label;
            return labels;
          },
          {} as { [key: string]: string }
        ),
      });

      for (const object of [newObservation, newTask]) {
        let snapshotString = JSON.stringify(getSnapshot(object));
        for (const [filename, sha] of fileHashes) {
          let newString = snapshotString.replace(`$${filename}`, sha);
          while (newString !== snapshotString) {
            snapshotString = newString;
            newString = snapshotString.replace(`$${filename}`, sha);
          }
        }
        const newSnapshot = JSON.parse(snapshotString);
        toDb.slowlyMergeObject(newSnapshot);
        log(`Write snag ${newSnapshot.id}`);
      }
      await toDb.commit();
      log('Writing snag objects done');
    });
  } catch (e) {
    debugger;
    log('Uncaught error copy from snagtracker %O', e);
  }
}

function parts(id: string) {
  return id.split('_');
}

function newIdFromOldId(id: string, postfix: string = '') {
  return parts(id).pop() + postfix;
}
