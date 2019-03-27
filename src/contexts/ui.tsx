import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import { observable, autorun, action, computed, IReactionDisposer } from 'mobx';
import { Icon, Overview, Calendar, Cubes } from 'grommet-icons';
import { Heading } from 'grommet';
import { observer } from 'mobx-react-lite';
import { MenuItemButton } from '../UI/components/context-menu';
import { runInThisContext } from 'vm';
import styled from '@emotion/styled-base';
import { RouteLink } from '../components/ui/RouteLink';

interface NavContext {
  label: string;
  path: string;
}

interface MenuItem {
  label: string;
  icon: Icon;
  actionFn: () => void;
}

interface ContextSubMenu {
  type: 'append';
  items: MenuItem[];
}

class UIState {
  public Provider: React.FunctionComponent<{}> = ({ children }) => (
    <UI.Provider value={this}>{children}</UI.Provider>
  );

  @observable
  public child: UIState | null = null;
  @observable
  public parent: UIState | null = null;

  @observable
  public navContext: NavContext | null = null;

  @computed
  get navContexts() {
    const path: NavContext[] = [];
    if (this.navContext) path.push(this.navContext);
    if (this.child) path.push(...this.child.navContexts);
    return path;
  }

  @observable
  public documentTitle: string | null = null;

  @computed
  get leafDocumentTitle(): string | null {
    return (this.child && this.child.leafDocumentTitle) || this.documentTitle;
  }

  @observable
  public contextSubMenu: ContextSubMenu | null = null;

  @computed
  get contextSubMenuItems() {
    const items: ContextSubMenu['items'] = [];
    if (this.contextSubMenu) {
      items.push(...this.contextSubMenu.items);
    }
    if (this.child) items.push(...this.child.contextSubMenuItems);
    return items;
  }

  constructor(
    options: { navContext?: NavContext; contextSubMenu?: ContextSubMenu },
    parent?: UIState
  ) {
    if (options.navContext) {
      this.navContext = options.navContext;
    }
    if (options.contextSubMenu) {
      this.contextSubMenu = options.contextSubMenu;
    }

    if (parent) {
      parent.attachChild(this);
      this.parent = parent;
    }

    if (parent == null) {
      // only the root node needs to update the document title
      this.documentTitleUpdater = autorun(() => {
        if (this.navContexts.length > 0) {
          window.document.title = this.navContexts[
            this.navContexts.length - 1
          ].label;
        }
      });
    }
  }

  private documentTitleUpdater: IReactionDisposer | null = null;

  @action
  public attachChild(child: UIState) {
    this.child = child;
  }
  @action
  public detachChild(child: UIState) {
    if (this.child === child) this.child = null;
  }

  @action
  public destroy() {
    if (this.parent) {
      this.parent.detachChild(this);
    }
    this.parent = null;
    this.documentTitleUpdater && this.documentTitleUpdater();
  }

  @computed
  public get title(): string {
    return this.navContexts.length > 0
      ? this.navContexts[this.navContexts.length - 1].label
      : '';
  }

  public Title: React.FunctionComponent<{}> = observer(() => {
    return <Heading level="3">{this.title}</Heading>;
  });

  private UnstyledNavContext: React.FunctionComponent<{
    className?: string;
  }> = observer(({ className }) => (
    <ul className={className}>
      {this.navContexts.slice().map((navContext, index) => {
        const active: boolean = index === this.navContexts.length - 1;
        return (
          <li key={navContext.label} className={active ? 'active' : ''}>
            {active ? (
              <span>{navContext.label}</span>
            ) : (
              <RouteLink href={navContext.path} label={navContext.label} />
            )}
          </li>
        );
      })}
    </ul>
  ));

  public NavContext = styled(this.UnstyledNavContext)`
    list-style: none;
    display: flex;
    padding: 0;
    margin: 0;

    li {
      display: inline-block;
    }
    li + li::before {
      padding: 0 5px;
      color: #ccc;
      content: '/\00a0';
    }
  `;

  public ContextSubMenu: React.FunctionComponent<{}> = observer(() => {
    return (
      <>
        {this.contextSubMenuItems.map(item => (
          <MenuItemButton
            key={item.label}
            icon={item.icon}
            label={item.label}
            actionFn={item.actionFn}
          />
        ))}
      </>
    );
  });
}
export const UI = createContext(
  new UIState({
    contextSubMenu: {
      type: 'append',
      items: [
        {
          icon: Overview,
          actionFn: () => {
            alert('Overzicht');
          },
          label: 'Overzicht',
        },
        {
          icon: Calendar,
          actionFn: () => {
            alert('Planning');
          },
          label: 'Planning',
        },
        {
          icon: Cubes,
          actionFn: () => {
            alert('BIM modellen');
          },
          label: 'BIM modellen',
        },
      ],
    },
  })
);

export const useUIContext = () => useContext(UI);

export const useNewUIContext = (
  options: ConstructorParameters<typeof UIState>[0]
) => {
  const parentState = useUIContext();
  const uiState = useMemo(() => new UIState(options, parentState), [
    options,
    parentState,
  ]);
  useEffect(() => () => uiState.destroy(), [uiState]);
  return uiState;
};
