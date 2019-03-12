import { Project, IProject } from '../src/models/Project';
import { Site, ISite } from '../src/models/Site';
import { Building, IBuilding } from '../src/models/Building';
import { BuildingStorey, IBuildingStorey } from '../src/models/BuildingStorey';
import { Sheet, ISheet } from '../src/models/Sheet';
import { Space, ISpace } from '../src/models/Space';
import debug from 'debug';
import nano from 'nano';
import { generateId } from '../src/utils/id';
import { getSnapshot, getType } from 'mobx-state-tree';
import crypto from 'crypto';
import PQueue from 'p-queue';
import fs from 'fs-extra';
import path from 'path';
import mime from 'mime';
import { Storage } from '../src/storage';
import { ServerAdapter } from '../src/storage/adapters/server';

const log = debug(__filename.replace(`${__dirname}/`, '').replace('.ts', ''));

const cdnDir = path.join(__dirname, '../cdn');
fs.ensureDirSync(cdnDir);

const dbDir = path.join(__dirname, '../db');
fs.ensureDirSync(dbDir);

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
    const target = path.join(cdnDir, filename);

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

(async function main() {
  try {
    const fromDbName = 'bk0wb0a7sz';
    const toDbName = `pokayoka${fromDbName}`;
    const server = nano('http://admin:admin@localhost:5984');
    const fromDb = server.use<{
      title: string;
      description: string;
      _attachments: any;
    }>(fromDbName);

    // try {
    //   await server.db.destroy(toDbName);
    // } catch (e) {}
    // await server.db.create(toDbName);
    const toDb = new Storage(new ServerAdapter(path.join(dbDir, toDbName)));

    const allRows = (await fromDb.list({ include_docs: true })).rows;

    const ids = allRows.map(row => row.id);
    const nonLeafIds = ids.filter(
      id => !!ids.find(childId => childId.indexOf(`${id}_`) > -1)
    );
    const nonLeafRows = allRows.filter(row => nonLeafIds.includes(row.id));

    const projects = nonLeafRows
      .filter(row => row.id === fromDbName)
      .map(row => row.doc!);

    const newObjects = new Map<
      IProject | ISite | IBuilding | IBuildingStorey | ISpace | ISheet,
      string
    >();

    projects.forEach(project => {
      const _projectId = project._id; // generateId();
      const newProject = Project().create({
        id: _projectId,
        globalId: _projectId,
        name: project.title,
        $files: Object.keys(project._attachments || {}),
      });
      newObjects.set(newProject, project._id);

      const _siteId = generateId();
      const newSite = Site().create({
        id: _siteId,
        globalId: _siteId,
        name: project.title,
      });
      newObjects.set(newSite, project._id);

      newSite.setProject(newProject);
      newProject.addSite(newSite);

      const id = generateId();
      const newBuilding = Building().create({
        id,
        globalId: id,
        name: project.title,
        description: project.description,
        $files: Object.keys(project._attachments || {}),
      });
      newObjects.set(newBuilding, project._id);

      newBuilding.setSite(newSite);
      newSite.addBuilding(newBuilding);

      const storeys = nonLeafRows
        .filter(
          row => parts(row.id)[0] === project._id && parts(row.id).length === 2
        )
        .map(row => row.doc!);

      storeys.forEach(storey => {
        const id = generateId();
        const newStorey = BuildingStorey().create({
          id,
          globalId: id,
          name: storey.title || '-- left blank --',
          description: storey.description,
          $files: Object.keys(storey._attachments || {}),
        });
        newObjects.set(newStorey, storey._id);

        newStorey.setBuilding(newBuilding);
        newBuilding.addBuildingStorey(newStorey);

        const _sheetId = generateId();
        const newSheet = Sheet().create({
          id: _sheetId,
          globalId: _sheetId,
          name: storey.title,
          $tiles: Object.keys(storey._attachments || {}),
        });
        newObjects.set(newSheet, storey._id);

        newSheet.setBuildingStorey(newStorey);
        newStorey.addSheet(newSheet);

        const spaces = nonLeafRows
          .filter(
            row =>
              parts(row.id)[0] === project._id &&
              parts(row.id)[1] === parts(storey._id)[1] &&
              parts(row.id).length === 3
          )
          .map(row => row.doc!);

        spaces.forEach(space => {
          const id = generateId();
          const newSpace = Space().create({
            id,
            globalId: id,
            name: space.title || '-- left blank --',
            description: space.description,
            $files: Object.keys(space._attachments || {}),
          });
          newObjects.set(newSpace, space._id);

          newSpace.setBuildingStorey(newStorey);
          newStorey.addSpace(newSpace);
        });
      });
    });

    const queue = new PQueue({ concurrency: 5 });

    for (const [object, originalId] of newObjects.entries()) {
      const snapshot = getSnapshot(object);
      let snapshotString = JSON.stringify(snapshot);

      const fileHashes = await Promise.all(
        Object.entries(
          (await fromDb.get(originalId))._attachments || {}
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
        let newString = snapshotString.replace(filename, sha);
        while (newString !== snapshotString) {
          snapshotString = newString;
          newString = snapshotString.replace(filename, sha);
        }
      }

      const newSnapshot = JSON.parse(snapshotString);

      log(newSnapshot);

      log(
        `Write ${newSnapshot.id} result: %j`,
        await toDb.slowlyMergeObject(newSnapshot)
      );
    }

    const foundIds = [...newObjects.values()];
    const snagIds = ids
      .filter(id => !foundIds.find(fid => fid === id))
      .filter(id => id[0] !== '_');
    log({ snagIds });
  } catch (e) {
    log('Uncaught error %O', e);
  }
})();

function parts(id: string) {
  return id.split('_');
}
