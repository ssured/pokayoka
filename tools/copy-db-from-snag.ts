import { Project, IProject } from '../src/models/Project';
import { Site, ISite } from '../src/models/Site';
import { Building, IBuilding } from '../src/models/Building';
import { BuildingStorey, IBuildingStorey } from '../src/models/BuildingStorey';
import { Space, ISpace } from '../src/models/Space';
import debug from 'debug';
import nano from 'nano';
import { generateId } from '../src/utils/id';
import { getSnapshot } from 'mobx-state-tree';

const log = debug(__filename.replace(`${__dirname}/`, '').replace('.ts', ''));

(async function main() {
  try {
    const fromDbName = 'bk0wb0a7sz';
    const toDbName = `pokayoka${fromDbName}`;
    const server = nano('http://admin:admin@localhost:5984');
    const fromDb = server.use<{ title: string; description: string }>(
      fromDbName
    );

    try {
      await server.db.destroy(toDbName);
    } catch (e) {}
    await server.db.create(toDbName);
    const toDb = server.use(toDbName);

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
      IProject | ISite | IBuilding | IBuildingStorey | ISpace,
      string
    >();

    projects.forEach(project => {
      const _projectId = project._id; // generateId();
      const newProject = Project().create({
        _id: _projectId,
        globalId: _projectId,
        name: project.title,
      });
      newObjects.set(newProject, project._id);

      const _siteId = generateId();
      const newSite = Site().create({
        _id: _siteId,
        globalId: _siteId,
        name: project.title,
      });
      newObjects.set(newSite, project._id);

      newSite.setProject(newProject);
      newProject.addSite(newSite);

      const _id = generateId();
      const newBuilding = Building().create({
        _id,
        globalId: _id,
        name: project.title,
        description: project.description,
      });
      newObjects.set(newBuilding, project._id);

      newBuilding.setSite(newSite);
      newSite.addBuilding(newBuilding);

      const storeys = nonLeafRows
        .filter(
          row => parts(row.id)[0] === project._id && parts(row.id).length === 2
        )
        .map(row => row.doc!)
        .filter(storey => storey.title != null);

      storeys.forEach(storey => {
        const _id = generateId();
        const newStorey = BuildingStorey().create({
          _id,
          globalId: _id,
          name: storey.title,
          description: storey.description,
        });
        newObjects.set(newStorey, storey._id);

        newStorey.setBuilding(newBuilding);
        newBuilding.addBuildingStorey(newStorey);

        const spaces = nonLeafRows
          .filter(
            row =>
              parts(row.id)[0] === project._id &&
              parts(row.id)[1] === parts(storey._id)[1] &&
              parts(row.id).length === 3
          )
          .map(row => row.doc!)
          .filter(space => space.title != null);

        spaces.forEach(space => {
          const _id = generateId();
          const newSpace = Space().create({
            _id,
            globalId: _id,
            name: space.title,
            description: space.description,
          });
          newObjects.set(newSpace, space._id);

          newSpace.setBuildingStorey(newStorey);
          newStorey.addSpace(newSpace);
        });
      });
    });

    for (const [object, originalId] of newObjects.entries()) {
      log(
        await toDb.insert({
          ...getSnapshot(object),
          // @ts-ignore
          _attachments: (await fromDb.get<{ _attachments: any }>(originalId, {
            attachments: true,
          }))._attachments,
        })
      );
    }
  } catch (e) {
    log('Uncaught error %O', e);
  }
})();

function parts(id: string) {
  return id.split('_');
}
