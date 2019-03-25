import React, { createContext, useContext, useEffect } from 'react';
import { observable, autorun, action } from 'mobx';
import { Icon, Overview, Calendar, Cubes } from 'grommet-icons';
import { Heading } from 'grommet';
import { observer } from 'mobx-react-lite';
import { MenuItemButton } from '../UI/components/context-menu';

interface Crumb {
  label: string;
  path: string;
}

interface MenuItem {
  label: string;
  icon: Icon;
  actionFn: () => void;
}

interface ContextMenu {
  type: 'replace' | 'append';
  items: MenuItem[];
}

class UIState {
  @observable
  public crumbs: Crumb[] = [{ label: 'Home', path: '/' }];

  @observable
  public titles: string[] = ['Pokayoka'];

  @observable
  public documentTitles: string[] = [];

  @observable
  public contextMenus: ContextMenu[] = [
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
      window.document.title = this.documentTitles[0] || this.titles[0];
    });
  }

  @action
  pushTitle(title: string) {
    this.titles.unshift(title);
  }

  @action
  popTitle(title: string) {
    this.titles.shift();
  }

  @action
  pushCrumb(crumb: Crumb) {
    this.crumbs.push(crumb);
  }

  @action
  popCrumb(crumb: Crumb) {
    const topCrumb = this.crumbs.slice(-1)[0];
    if (!isEqualCrumb(topCrumb, crumb)) {
      throw new Error(
        JSON.stringify({
          error: 'Cannot pop crumb',
          crumb,
          crumbs: this.crumbs,
        })
      );
    }
    this.crumbs.pop();
  }

  @action
  pushContextMenu(contextMenu: ContextMenu) {
    // we use unshift, as we use the context menu in reverse order for rendering
    this.contextMenus.unshift(contextMenu);
  }

  @action
  popContextMenu(contextMenu: ContextMenu) {
    // const topContextMenu = this.contextMenus.slice(-1)[0];
    // if (!isEqualContextMenu(topContextMenu, contextMenu)) {
    //   throw new Error(
    //     JSON.stringify({
    //       error: 'Cannot pop contextMenu',
    //       contextMenu,
    //       contextMenus: this.contextMenus,
    //     })
    //   );
    // }
    this.contextMenus.shift();
  }

  public Title: React.FunctionComponent<{}> = observer(() => {
    return <Heading level="3">{this.titles[0]}</Heading>;
  });

  public ContextMenu: React.FunctionComponent<{}> = observer(() => {
    const items: MenuItem[] = [];

    for (const menu of this.contextMenus) {
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

export const useUITitle = (title: string) => {
  const ui = useUIContext();
  useEffect(() => {
    ui.pushTitle(title);
    return () => ui.popTitle(title);
  }, [title]);
};

export const useUICrumb = (crumbThunk: () => Crumb, deps: any[] = []) => {
  const ui = useUIContext();
  useEffect(() => {
    const crumb = crumbThunk();
    ui.pushCrumb(crumb);
    return () => ui.popCrumb(crumb);
  }, deps);
};

export const useUIContextMenu = (
  contextMenuThunk: () => ContextMenu,
  deps: any[] = []
) => {
  const ui = useUIContext();
  useEffect(() => {
    const menu = contextMenuThunk();
    ui.pushContextMenu(menu);
    return () => ui.popContextMenu(menu);
  }, deps);
};

// Helper functions

function isEqualCrumb(a: Crumb, b: Crumb) {
  return a === b || (a.label === b.label && a.path === b.path);
}
