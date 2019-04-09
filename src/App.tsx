import React, { useContext } from 'react';
import { Grommet, Button } from 'grommet';
import { grommet } from 'grommet/themes';

import styled from 'styled-components';
import * as Icons from 'grommet-icons';

import { Router, navigate, RouteComponentProps } from '@reach/router';

import { Home } from './routes/Home';
import { Projects } from './routes/Projects';

import { CapabilitiesCheck } from './components/CapabilitiesCheck';
import { LoginForm } from './components/LoginForm/index';
import { useAuthentication } from './contexts/authentication';
import { useToggle } from 'react-use';

import { MenuItemButton, ButtonLiner } from './UI/components/context-menu';
import { useUIContext, useNewUIContext } from './contexts/ui';
import { Site } from './routes/Sites/Site/index';
import { Building } from './routes/Buildings/Building/index';
import { BuildingStorey } from './routes/BuildingStoreys/BuildingStorey/index';
import { Sheet } from './routes/Sheets/Sheet/index';
import { Sync } from './routes/Sync/index';
import { Tree } from './routes/Tree/index';
import { Columns } from './routes/Columns/index';

const NotFound: React.FunctionComponent<RouteComponentProps<{}>> = () => {
  return <p>Not Found</p>;
};

const { Menu, Close } = Icons;

const SidebarContext = React.createContext<boolean>(false);

const Wrapper: React.FunctionComponent<{
  className?: string;
}> = ({ className = '', children }) => (
  <div className={className}>
    <div className="grid-contrainer">{children}</div>
  </div>
);

const StyledWrapper = styled(Wrapper)`
  height: 100vh;
  overflow-y: auto;

  .grid-contrainer {
    min-height: 100%;
    display: grid;
    grid-gap: 10px;

    > * {
      @import url('https://fonts.googleapis.com/css?family=Roboto:100,400');
      border: 1px solid lightgrey;
      overflow: hidden;
      color: rgb(66, 66, 66);
      font-family: 'Roboto', sans-serif;
    }

    @media only screen and (min-width: 768px) {
      /* tablets and desktop */
      grid-template-areas:
        'ctx     ctx     ctx     ctx     ctx     ctx     ctx     ctx     nav'
        'content content content content content content content content nav'
        'footer  footer  footer  footer  footer  footer  footer  footer  nav';
      grid-template-rows: auto 1fr 40px;
      grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
    }

    @media only screen and (max-width: 767px) {
      /* phones */
      grid-template-areas:
        'ctx'
        'content'
        'nav';
      grid-template-rows: 60px 1fr 60px;
    }
  }
`;

const ToggleNavButton: React.FunctionComponent<{
  className?: string;
  toggleSidebar: () => void;
}> = ({ className = '', toggleSidebar }) => {
  const isSidebarOpen = useContext(SidebarContext);

  return (
    <Button
      plain
      hoverIndicator={true}
      className={`toggle-nav ${className}`}
      onClick={() => toggleSidebar()}
    >
      <ButtonLiner>
        {isSidebarOpen ? <Close size="medium" /> : <Menu size="medium" />}
      </ButtonLiner>
    </Button>
  );
};

const Header = styled.nav`
  grid-area: ctx;
  height: calc(48px + 0.5em);
  padding: 12px 0.5em;
  align-items: center;
`;

const Content = styled.main`
  grid-area: content;
  display: flex;
  flex-direction: column;
`;

/*
Alternatief: gebruik maken van Grommet sidebar
https://storybook.grommet.io/?path=/story/collapsible--horizontal
*/
const UnstyledMainNav: React.FunctionComponent<{
  className?: string;
  toggleSidebar: () => void;
  isSidebarOpen: boolean; // because we style this component, we
}> = ({ className = '', children, toggleSidebar, isSidebarOpen }) => {
  return (
    <aside className={`${className} ${isSidebarOpen ? 'open' : 'closed'}`}>
      <div className="fixed">
        <div className="toggle-nav">
          <div className="spacer" />
          <ToggleNavButton
            className="toggle-button"
            toggleSidebar={toggleSidebar}
          />
        </div>
        <div className="menu-items">{children}</div>
      </div>
    </aside>
  );
};

const MainNav = styled(UnstyledMainNav)`
  grid-area: nav;
  display: flex;

  /* MEDIA=PHONES */
  @media only screen and (max-width: 767px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    flex-direction: row;

    /* hide menu button */
    .toggle-nav {
      display: none;
    }

    .fixed {
      flex: 1;
      display: flex;
      flex-direction: row;

      .menu-items {
        flex: 1;
        display: flex;
        flex-direction: row;
        justify-content: space-around;

        .context-menu-items {
          display: none;
        }

        .label {
          display: none;
        }
      }
    }
  }

  /* MEDIA=tablets and desktop */
  @media only screen and (min-width: 768px) {
    position: relative;
    transition: width 0.1s;
    width: ${props => (props.isSidebarOpen ? '15em' : '4em')};

    .fixed {
      position: fixed;
      width: inherit;
      padding: 0 0.5em;
      flex-direction: column;
      height: 100%;

      .toggle-nav {
        display: flex;
        flex-direction: row;
        height: 48px;
        margin-bottom: 10px;

        .spacer {
          flex: 1;
        }

        .toggle-button {
          width: 48px;
        }
      }

      .menu-items {
        flex: 1;
        display: flex;
        flex-direction: column;

        .context-menu-items {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-top: 2em;
        }

        .menu-item {
          display: flex;
          flex-direction: row;
          .icon {
            width: 48px;
          }

          .label {
            flex: 1;

            span {
              /* dont wrap label to next line */
              white-space: pre;
            }
          }
          &:hover {
            background-color: rgba(221, 221, 221, 0.4);
          }
        }
      }
    }
  }
`;

const Footer: React.FunctionComponent<{
  className?: string;
}> = ({ className = '', children }) => (
  <footer className={className}>
    <h1>Pokayoka</h1>
    {children}
  </footer>
);

const StyledFooter = styled(Footer)`
  grid-area: footer;
  /* MEDIA=PHONES */
  @media only screen and (max-width: 767px) {
    display: none;
  }
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  h1 {
    font-size: 32px;
    font-family: 'Roboto', sans-serif;
    font-weight: 100;
    text-transform: capitalize;
  }
`;

const StyledRouter = styled(Router)`
  flex: 1;
  display: flex;
  flex-direction: column;

  > * {
    min-height: 100%;
  }
`;

export const App: React.FunctionComponent<{}> = () => {
  const {
    isAuthenticated,
    login,
    authentication,
    logout,
  } = useAuthentication();
  const newUIContext = useNewUIContext({
    navContext: { label: 'Home', path: '/' },
  });

  const [isSidebarOpen, toggleSidebar] = useToggle(false);
  const UI = useUIContext();

  return (
    <newUIContext.Provider>
      <Grommet theme={grommet}>
        <CapabilitiesCheck>
          {!isAuthenticated ? (
            <LoginForm
              onAuthentication={(name, roles) =>
                login({ ok: true, name, roles })
              }
            />
          ) : (
            <StyledWrapper>
              <SidebarContext.Provider value={isSidebarOpen}>
                <Content>
                  <StyledRouter>
                    <Home path="/" />
                    {/* <Debug path="debug" /> */}
                    <Sync path="sync" />
                    <Projects path="projects/*" />
                    <Site path="sites/:siteId/*" />
                    <Building path="buildings/:buildingId/*" />
                    <BuildingStorey path="buildingStoreys/:buildingStoreyId/*" />
                    <Sheet path="sheets/:sheetId/*" />

                    <Tree path="tree" />
                    <Columns path="columns/:projectCode" />

                    <NotFound default />
                    {/* <User path=":userId">
                  <Project path=":projectId" />
                </User> */}
                  </StyledRouter>
                </Content>
                <MainNav
                  toggleSidebar={toggleSidebar}
                  isSidebarOpen={isSidebarOpen}
                >
                  <MenuItemButton
                    icon={Icons.Home}
                    actionFn={() => navigate('/')}
                    label="Beginscherm"
                  />
                  <MenuItemButton
                    icon={Icons.Projects}
                    actionFn={() => {
                      navigate('/projects');
                    }}
                    label="Projecten"
                  />
                  <MenuItemButton
                    icon={Icons.Book}
                    actionFn={() => {
                      alert('Verwerkingsinstructies');
                    }}
                    label="Verwerkingsinstructies"
                  />
                  <div className="context-menu-items">
                    <UI.ContextSubMenu />
                  </div>
                </MainNav>
              </SidebarContext.Provider>
            </StyledWrapper>
          )}
        </CapabilitiesCheck>
      </Grommet>
    </newUIContext.Provider>
  );
};
