import React, { createContext, useContext, useEffect } from 'react';
import { observable, autorun, action, computed } from 'mobx';
import { Icon, Overview, Calendar, Cubes } from 'grommet-icons';
import { Heading, Anchor } from 'grommet';
import { observer } from 'mobx-react-lite';
import { MenuItemButton } from '../UI/components/context-menu';
import { runInThisContext } from 'vm';
import styled from '@emotion/styled-base';

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
  type: 'replace' | 'append';
  items: MenuItem[];
}

class UIState {
  @observable
  public navContexts: NavContext[] = [];

  @observable
  public documentTitles: string[] = [];

  @observable
  public contextSubMenus: ContextSubMenu[] = [
    {
      type: 'replace',
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
  ];

  constructor() {
    autorun(() => {
      window.document.title =
        this.documentTitles.length > 0 ? this.documentTitles[0] : this.title;
    });
  }

  @action
  pushNavContext(navContext: NavContext) {
    this.navContexts.push(navContext);
  }

  @action
  popNavContext(navContext: NavContext) {
    const topNavContext = this.navContexts.slice(-1)[0];
    if (!isEqualNavContext(topNavContext, navContext)) {
      throw new Error(
        JSON.stringify({
          error: 'Cannot pop navContext',
          navContext: navContext,
          navContexts: this.navContexts,
        })
      );
    }
    this.navContexts.pop();
  }

  @action
  pushContextSubMenu(contextSubMenu: ContextSubMenu) {
    // we use unshift, as we use the context menu in reverse order for rendering
    this.contextSubMenus.unshift(contextSubMenu);
  }

  @action
  popContextSubMenu(contextSubMenu: ContextSubMenu) {
    // const topContextSubMenu = this.contextSubMenus.slice(-1)[0];
    // if (!isEqualContextSubMenu(topContextSubMenu, contextSubMenu)) {
    //   throw new Error(
    //     JSON.stringify({
    //       error: 'Cannot pop contextSubMenu',
    //       contextSubMenu,
    //       contextSubMenus: this.contextSubMenus,
    //     })
    //   );
    // }
    this.contextSubMenus.shift();
  }

  @computed
  public get title(): string {
    return this.navContexts[this.navContexts.length - 1].label;
  }

  public Title: React.FunctionComponent<{}> = observer(() => {
    return <Heading level="3">{this.title}</Heading>;
  });

  private UnstyledNavContext: React.FunctionComponent<{}> = observer(() => (
    <ul>
      {this.navContexts.map((navContext, index) => {
        const active: boolean = index === this.navContexts.length - 1;
        return (
          <li className={active ? 'active' : ''}>
            {active ? (
              <span>{navContext.label}</span>
            ) : (
              <Anchor href={navContext.path} label={navContext.label} />
            )}
          </li>
        );
      })}
    </ul>
  ));

  public NavContext = styled(this.UnstyledNavContext)`
    list-style: none;
    display: flex;
    justify-content: space-between;
    padding: 0;
    margin: 0;

    li::after {
      content: '/';
    }
  `;

  public ContextSubMenu: React.FunctionComponent<{}> = observer(() => {
    const items: MenuItem[] = [];

    for (const menu of this.contextSubMenus) {
      items.push(...menu.items);
      if (menu.type === 'replace') break;
    }

    return (
      <>
        {items.map(item => (
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

const UI = createContext(new UIState());

export const useUIContext = () => useContext(UI);

export const useUINavContext = (
  navContextThunk: () => NavContext,
  deps: any[] = []
) => {
  const ui = useUIContext();
  useEffect(() => {
    const navContext = navContextThunk();
    ui.pushNavContext(navContext);
    return () => ui.popNavContext(navContext);
  }, deps);
};

export const useUIContextSubMenu = (
  contextSubMenuThunk: () => ContextSubMenu,
  deps: any[] = []
) => {
  const ui = useUIContext();
  useEffect(() => {
    const menu = contextSubMenuThunk();
    ui.pushContextSubMenu(menu);
    return () => ui.popContextSubMenu(menu);
  }, deps);
};

// Helper functions

function isEqualNavContext(a: NavContext, b: NavContext) {
  return a === b || (a.label === b.label && a.path === b.path);
}
