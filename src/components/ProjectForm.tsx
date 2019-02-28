import React, { useRef } from 'react';
import { useObserver } from 'mobx-react-lite';

import {
  types,
  getSnapshot,
  onSnapshot,
  clone,
  applySnapshot,
} from 'mobx-state-tree';
import { Field, Form, converters, FieldAccessor } from 'mstform';
import { Project, IProject } from '../models/Project';

const form = new Form(Project(), {
  title: new Field(converters.string),
});

type InlineErrorProps = {
  field?: FieldAccessor<any, any>;
};

const InlineError: React.FunctionComponent<InlineErrorProps> = ({
  children,
  field,
}) =>
  useObserver(() => (
    <div>
      {children}
      {field && <span>{field.error}</span>}
    </div>
  ));

const MyInput: React.FunctionComponent<{
  type: string;
  field: FieldAccessor<any, any>;
}> = ({ type, field }) =>
  useObserver(() => <input type={type} {...field.inputProps} />);

const MyTextArea: React.FunctionComponent<{
  field: FieldAccessor<any, any>;
}> = ({ field }) => useObserver(() => <textarea {...field.inputProps} />);

type ProjectFormProps = {
  project: IProject;
};

export const ProjectForm: React.FunctionComponent<ProjectFormProps> = ({
  project,
}) => {
  const { current: formState } = useRef(
    form.state(clone(project, false), {
      save: async node => {
        // console.log(getSnapshot(node));
        applySnapshot(project, getSnapshot(node));
        return null;
      },
    })
  );

  const handleSave = () => {
    formState.save().then(r => {
      console.log('saved success', r);
    });
  };

  const title = formState.field('title');
  return (
    <div>
      <span>Title</span>
      <InlineError field={title}>
        <MyInput type="text" field={title} />
      </InlineError>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
