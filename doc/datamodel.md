base-58 id

# GENERAL INDEXES ON EVERY RECORD

- type: _string_ `${typename}_${version}`
- modelIds?: _string[]_ `unique reference to something in the model`
- elementIds?: _string[]_
- labels?: _string[]_
  generate views:
  byType => doc.type && emit(doc.type.split('_'))
  byModelId => doc.modelIds && doc.modelIds.forEach(modelId => emit([modelId, doc.type.split('_').shift()]))
  byElementId => doc.elementIds && doc.elementIds.forEach(elementId => emit([elementId, doc.type.split('_').shift()]))
  byLabel => doc.labels.forEach(label => emit([label, doc.type.split('_').shift()]))

Translation table:
Taak => Task
Opdracht => Job = A group of homogeneous tasks related by similarity of functions. Read more: http://www.businessdictionary.com/definition/job.html

# Project

- **plans: _Plan[]_ (fat means computed from an index)**
- **tasks: _Task[]_**
- name: _string_

# Model

- project: **Project**
- version: _string_ `version or filename`
- sortIndex: _number_
- IFC Root element -> points to database with scoped IFC elements

# Plan

- project: **Project**
- name: _string_
- sortIndex: _number_
- orientation: 3d-transformation matrix so that (x,y) aligns on the plane of the plan (x: [0, width], y: [0, width])
- width: _number_ `pixels on max zoom level`
- height: _number_ `pixels on max zoom level`
- thumb: _filehash_
- tiles[]:

  - x: _number_
  - y: _number_
  - z: _number_
  - file: _filehash_

- ifcStoreyId?: _string_ `id of IFC storey element related to this plan`

# Fact

> Bevinding - wordt op 1 moment opgenomen en is daarna immutable
> als je foto per object wilt, dan maak je steeds nieuwe facts aan
> anders heb je aan een lijst van occurrences
> alleen als er één occurrence is dan is de image gerelateerd aan het feit

- signature: _string_ `${usedPublicKey}_${hash}`
- owner: **User**
- createdOn: _ISO860_

> MUST HAVE task OR location

- task?: `voor voortgang`

  - id?: **Task**
  - progressPct?: _number_

- location?: `voor vastlegging`

  - id: **Plan**
  - position: {x: _number_, y: _number_}

- touch?: _boolean_ `to indicate I've been there, nothing else. Other items must be empty`
- progressPct?: number
- images?: **Image[]**
- remark?: _string_

Opdracht bevat taken
Taak bevat 1 of meerdere posities
Feit

# Plan

- name: _string_
- description: _string_
- parentPlan?: **Plan** `if empty then it is the root element`
- planned:
  - start
  - end
  - budget
    > Actual is calculated from the actual realisations of a JOB

# Job

- name: _string_
- description: _string_
- parentPlan: **Plan** `can not be empty`
- planned:

  - start
  - end
  - budget
    > Above is same as _Plan_, except that parentPlan cannot be empty

- precedingJobs?: **Job[]** `to add constraints`
- actual:
  - start
  - end
  - budget

# Task

> beschrijft een doel
> what about subtask support?

- **facts: _Fact[]_**

- jobId?: **Job**

  <!-- - precedingTasks?: **Task[]** -->

- project: **Project**
- createdBy: **User**
- createdOn: _ISO860_

> these labels below are each indexed on every entity

- modelId?: _string[]_ `unique reference to something in the model`
- elementId?: _string[]_
- label?: _string[]_

* planId: **Plan**,
* position: {x: _number_, y: _number_}

* **status?: **Fact** `pointer naar het meest recente fact?`**

# UserProfile

- **user: _User_**
- name: _string_
- photo: _filehash_

# User

> editable only on the server because its a security object

- serverSignature: _string_
- profile: _UserProfile_
- agreedToTerms[]:

  - version: _string_
  - agreedOn: _ISO860_

- emails[]:

  - address: _string_
  - validatedOn: _date | undefined_

- publicKeys[]:

  - key: _string_
  - validatedOn: _date | undefined_

- tokens[]: _string_
- password: _string_
