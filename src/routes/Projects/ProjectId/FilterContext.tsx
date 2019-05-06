import { Box, Button, DropButton, Layer, Select, FormField } from 'grommet';
import { Close, Filter as FilterIcon, FormClose } from 'grommet-icons';
import { observable, action } from 'mobx';
import { observer, useObserver } from 'mobx-react-lite';
import React, { createContext, useState } from 'react';
import {
  getAccountable,
  getResponsible,
  taskStatus,
} from '../../../model/Task';
import { Maybe, getPath } from '../../../utils/universe';
import { SelectHierarchy } from './Tasks/List';
import { fullName, isPPerson } from '../../../model/Person';
import { useQuery, getSubject } from '../../../contexts/spo-hub';
import { subj } from '../../../utils/spo';
import { isEqual } from '../../../utils/index';

const FilterItem: React.FunctionComponent<{ onClick?: () => void }> = ({
  children,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      label={
        <Box direction="row" gap="small">
          {children}
          {hovered ? (
            <Close onClick={onClick} />
          ) : (
            <FormClose onClick={onClick} />
          )}
        </Box>
      }
    />
  );
};

type SelectOption<T> = {
  label: string;
  value: T;
};

const EditFilter: React.FunctionComponent<{
  filter: Filter;
}> = observer(({ filter }) => {
  const [open, setOpen] = useState<boolean | undefined>(undefined);
  const close = () => {
    setOpen(false);
    setTimeout(() => setOpen(undefined), 1);
  };

  const results = useQuery(v => [
    {
      s: v('s'),
      p: '@type',
      o: 'PPerson',
      // filter: tuple => true
    },
  ]);

  const persons = results
    .map(result => getSubject<PPerson>((result.variables as any).s))
    .filter(isPPerson) as PPerson[];

  const options: SelectOption<PPerson>[] = persons.map(person => ({
    label: fullName(person),
    value: person,
  }));
  // .filter(option => search == null || search.test(option.label));

  return (
    <DropButton
      icon={<FilterIcon />}
      primary
      open={open}
      onClose={close}
      dropContent={
        <Layer full>
          <Box align="end">
            <Button icon={<Close />} onClick={close} />
          </Box>

          <Box pad="medium">
            <FormField label="Filter verantwoordelijke">
              <Select
                size="medium"
                placeholder="Verantwoordelijk"
                // multiple
                labelKey="label"
                valueKey="value"
                value={options.find(
                  option => filter.responsible === option.value
                )}
                options={options}
                onChange={({ value }) => {
                  filter.setResponsible(value.value);
                }}
                // onChange={({ value: nextValue }) =>
                //   this.setState({ value: nextValue })
                // }
                // onClose={() => this.setState({ options: defaultOptions })}
                // onSearch={text => {
                //   const exp = new RegExp(text, 'i');
                //   this.setState({
                //     options: defaultOptions.filter(o => exp.test(o)),
                //   });
                // }}
              />
            </FormField>
          </Box>
        </Layer>
      }
    />
  );
});

export class Filter {
  @observable
  status: taskStatus | null = null;

  @observable
  labels: string[] = [];

  @observable
  object: PProject | PSite | PBuilding | PBuildingStorey;

  @observable
  accountablePath: subj | null = null;

  get accountable(): PPerson | null {
    return (
      (this.accountablePath && (getSubject(this.accountablePath) as any)) ||
      null
    );
  }

  @action
  setAccountable(accountable: PPerson | null) {
    this.accountablePath = (accountable && getPath(accountable)) || null;
  }

  @observable
  responsiblePath: subj | null = null;

  get responsible(): PPerson | null {
    return (
      (this.responsiblePath && (getSubject(this.responsiblePath) as any)) ||
      null
    );
  }

  @action
  setResponsible(responsible: PPerson | null) {
    this.responsiblePath = (responsible && getPath(responsible)) || null;
  }

  /**
   *    Todo:
   * add space
   * add element
   * add created date from+to
   * add edited date from+to
   */
  constructor(public forProject: PProject) {
    this.object = forProject;
  }

  get currentFilter() {
    return (task: PTask): boolean => {
      if (
        this.accountable != null &&
        !isEqual(this.accountablePath, getPath(getAccountable(task)))
      ) {
        return false;
      }

      if (
        this.responsible != null &&
        !isEqual(this.responsiblePath, getPath(getResponsible(task)))
      ) {
        return false;
      }

      return true;
    };
  }

  get FilterRow(): React.FunctionComponent<{}> {
    return observer(({}) => (
      <Box direction="row" justify="between">
        <SelectHierarchy project={this.forProject} />

        <Box direction="row" gap="medium">
          {this.responsible && (
            <FilterItem
              key={this.responsible.identifier}
              onClick={() => this.setResponsible(null)}
            >
              {fullName(this.responsible)}
            </FilterItem>
          )}

          {this.accountable && (
            <FilterItem
              key={this.accountable.identifier}
              onClick={() => this.setAccountable(null)}
            >
              {fullName(this.accountable)}
            </FilterItem>
          )}

          <EditFilter filter={this} />
        </Box>
      </Box>
    ));
  }
}

export const FilterContext = createContext<Filter>(null as any);
