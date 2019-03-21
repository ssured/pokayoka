import React, { useContext } from 'react';
// import logo from "./logo.svg";
// import "./App.css";
import { Button, Box, Text } from 'grommet';
import styled from 'styled-components';
import * as Icons from 'grommet-icons';

import { Router, navigate, RouteComponentProps } from '@reach/router';

import { Home } from './routes/Home';
import { Project } from './routes/Project';

import { CapabilitiesCheck } from './components/CapabilitiesCheck';
import { LoginForm } from './components/LoginForm/index';
import { useAuthentication } from './contexts/authentication';
import { useToggle } from 'react-use';

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
  overflow-y: scroll;

  .grid-contrainer {
    min-height: 100%;
    display: grid;
    grid-gap: 10px;

    > * {
      border: 1px solid lightgrey;
    }

    @media only screen and (min-width: 768px) {
      /* tablets and desktop */
      grid-template-columns: repeat(9, 1fr);
      grid-template-areas:
        'header  header  header  header  header  header  header  header  sidebar '
        'nav     nav     nav     nav     nav     nav     nav     nav     sidebar'
        'content content content content content content content content sidebar'
        'footer  footer  footer  footer  footer  footer  footer  footer  footer ';
      grid-template-rows: 60px 40px 1fr 40px;
      grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
    }

    @media only screen and (max-width: 767px) {
      /* phones */
      grid-template-areas:
        'header'
        'sidebar'
        'nav'
        'content'
        'footer';
      grid-template-rows: 60px auto 40px 1fr 40px;
    }
  }
`;

const ToggleSidebarButton: React.FunctionComponent<{
  className?: string;
  toggleSidebar: () => void;
}> = ({ className = '', toggleSidebar }) => {
  const isSidebarOpen = useContext(SidebarContext);

  return (
    <Button
      className={`toggle-sidebar ${className}`}
      onClick={() => toggleSidebar()}
    >
      {isSidebarOpen ? <Close size="large" /> : <Menu size="large" />}
    </Button>
  );
};

const Header: React.FunctionComponent<{
  className?: string;
  toggleSidebar: () => void;
}> = ({ className = '', toggleSidebar }) => {
  const isSidebarOpen = useContext(SidebarContext);
  return (
    <header className={className}>
      Pokayoka
      <ToggleSidebarButton toggleSidebar={toggleSidebar} />
    </header>
  );
};

const StyledHeader = styled(Header)`
  grid-area: header;
  display: flex;
  flex-direction: row;
  .toggle-sidebar {
    display: inline-block;
  }
  .center {
    flex: 1;
  }
  img {
    height: 100%;
  }
  @media only screen and (min-width: 768px) {
    /* tablets and desktop */
    /* hide menu button */
    .toggle-sidebar {
      display: none;
    }
  }
`;

const Nav = styled.nav`
  grid-area: nav;

  ul {
    display: flex;
    justify-content: space-between;
  }
`;
const Content = styled.main`
  grid-area: content;
`;

const Sidebar: React.FunctionComponent<{
  className?: string;
  toggleSidebar: () => void;
  isSidebarOpen: boolean; // because we style this component, we
}> = ({ className = '', children, toggleSidebar, isSidebarOpen }) => {
  return (
    <aside className={`${className} ${isSidebarOpen ? 'open' : 'closed'}`}>
      <div className="buttons">
        <span className="spacer" />
        <ToggleSidebarButton toggleSidebar={toggleSidebar} />
      </div>
      <Box fill direction="row">
        <Box fill>{children}</Box>
      </Box>
    </aside>
  );
};

const StyledSidebar = styled(Sidebar)`
  grid-area: sidebar;
  overflow: hidden;

  ul.menu {
    display: flex;
    flex-direction: column;
    list-style: none;
    padding: 0;

    li {
      display: flex;

      a {
        width: 100vw;
        padding: 0.5em;
        text-align: right;
      }
    }
  }

  /* MEDIA=tablets and desktop */
  @media only screen and (min-width: 768px) {
    transition: width 0.1s;
    display: flex;
    flex-direction: column;
    width: ${props => (props.isSidebarOpen ? '15em' : '3em')};
    padding: 0.5em;

    .buttons {
      display: flex;
      align-items: flex-end;
      margin-bottom: 10px;

      .spacer {
        flex: 1;
      }
    }
  }

  /* MEDIA=PHONES */
  @media only screen and (max-width: 767px) {
    /* hide sidebar when not open */
    display: ${props => (props.isSidebarOpen ? 'block' : 'none')};
    /* hide menu button */
    .buttons {
      display: none;
    }
  }
`;

const MenuItemButton: React.FunctionComponent<{
  className?: string;
  icon: React.ElementType;
  label: string;
  actionFn: (...args: any[]) => any;
  children?: never;
}> = ({ className = '', icon, label, actionFn }) => {
  const Icon = icon;
  return (
    <Button
      plain
      hoverIndicator={true}
      className={className}
      onClick={actionFn}
      title={label}
      a11yTitle={label}
    >
      <div className="button-inner">
        <Icon size="medium" />
        <div className="spacer" />
        <Text>{label}</Text>
      </div>
    </Button>
  );
};

const StyledMenuItemButton = styled(MenuItemButton)`
  .button-inner {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding: 12px;
    outline: none;
  }

  .spacer {
    flex: 0 0 auto;
    width: 24px;
  }

  /* MEDIA=PHONES */
  @media only screen and (max-width: 767px) {
    .button-inner {
      padding: 16px 24px;
    }
  }
`;

const Footer = styled.footer`
  grid-area: footer;
`;

export const App: React.FunctionComponent<{}> = () => {
  const {
    isAuthenticated,
    login,
    authentication,
    logout,
  } = useAuthentication();

  const [isSidebarOpen, toggleSidebar] = useToggle(true);

  return (
    <CapabilitiesCheck>
      {!isAuthenticated ? (
        <LoginForm
          onAuthentication={(name, roles) => login({ ok: true, name, roles })}
        />
      ) : (
        <StyledWrapper>
          <SidebarContext.Provider value={isSidebarOpen}>
            <StyledHeader toggleSidebar={toggleSidebar} />
            <Nav>
              <ul>
                <li>
                  <a href="">Navf 1</a>
                </li>
                <li>
                  <a href="">Nav 2</a>
                </li>
                <li>
                  <a href="">Nav 3</a>
                </li>
              </ul>
            </Nav>
            <Content>
              <Router>
                <Home path="/" />
                {/* <Debug path="debug" /> */}
                {/* <SyncStatus path="sync" /> */}
                <Project path="/:projectId/*" />
                <NotFound default />
                {/* <User path=":userId">
                  <Project path=":projectId" />
                </User> */}
              </Router>
            </Content>
            <StyledSidebar
              toggleSidebar={toggleSidebar}
              isSidebarOpen={isSidebarOpen}
            >
              <StyledMenuItemButton
                icon={Icons.Home}
                actionFn={() => navigate('/')}
                label="Beginscherm"
              />
              <StyledMenuItemButton
                icon={Icons.Overview}
                actionFn={() => {
                  alert('Overzicht');
                }}
                label="Overzicht"
              />
              <StyledMenuItemButton
                icon={Icons.Calendar}
                actionFn={() => {
                  alert('Planning');
                }}
                label="Planning"
              />
              <StyledMenuItemButton
                icon={Icons.Bug}
                actionFn={() => navigate('/bk0wb0a7sz/observations')}
                label="Bevindingen"
              />
              <StyledMenuItemButton
                icon={Icons.MapLocation}
                actionFn={() => navigate('/bk0wb0a7sz/sheets')}
                label="Bouwlagen"
              />
              <StyledMenuItemButton
                icon={Icons.Cubes}
                actionFn={() => {
                  alert('BIM modellen');
                }}
                label="BIM modellen"
              />
              <StyledMenuItemButton
                icon={Icons.User}
                actionFn={() => {
                  alert('Profiel');
                }}
                label={authentication.ok ? authentication.name : 'Anonymous'}
              />
              {authentication.ok && (
                <StyledMenuItemButton
                  icon={Icons.Logout}
                  actionFn={() => {
                    logout();
                    navigate('/');
                  }}
                  label="Uitloggen"
                />
              )}
            </StyledSidebar>
            <Footer>Footer</Footer>
          </SidebarContext.Provider>
        </StyledWrapper>
      )}
    </CapabilitiesCheck>
  );
};
