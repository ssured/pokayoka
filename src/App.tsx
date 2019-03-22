import React, { useState, useContext } from 'react';
// import logo from "./logo.svg";
// import "./App.css";
import { Grommet, Grid, Heading, Button, Box, Text } from 'grommet';
import styled from 'styled-components';
import * as Icons from 'grommet-icons';

import { Router, navigate } from '@reach/router';

import { Home } from './routes/Home';
import { Project } from './routes/Project';

import { CapabilitiesCheck } from './components/CapabilitiesCheck';
import { LoginForm } from './components/LoginForm/index';
import { useAuthentication } from './contexts/authentication';
import { useToggle } from 'react-use';

const { Menu, Close, Home: HomeIcon, Sync } = Icons;

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
      grid-template-rows: 40px 1fr 40px;
      grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
    }

    @media only screen and (max-width: 767px) {
      /* phones */
      grid-template-areas:
        'ctx'
        'content'
        'nav';
      grid-template-rows: 60px auto 40px 1fr 40px;
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

const ContextNav = styled.nav`
  grid-area: ctx;

  ul {
    display: flex;
    justify-content: space-between;
  }
`;
const Content = styled.main`
  grid-area: content;
`;

const MainNav: React.FunctionComponent<{
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

const StyledMainNav = styled(MainNav)`
  grid-area: nav;
  overflow: hidden;
  position: relative;

  .fixed {
    position: fixed;
    width: inherit;
    padding: 0.5em;
    display: flex;
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
        }
        &:hover {
          background-color: rgba(221,221,221,0.4);
        }
      }
    }
  }
  /* ul.menu {
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
  } */

  /* MEDIA=tablets and desktop */
  @media only screen and (min-width: 768px) {
    transition: width 0.1s;
    width: ${props => (props.isSidebarOpen ? '15em' : '4em')};

    /* .buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;

      margin-bottom: 10px;

      .spacer {
        width: 0;
      }
    } */
  }

  /* MEDIA=PHONES */
  /* @media only screen and (max-width: 767px) { */
    /* hide nav when not open */
    /* display: ${props => (props.isSidebarOpen ? 'block' : 'none')}; */
    /* hide menu button */
    /* .buttons {
      display: none;
    }
  } */
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
    <div className={`${className} menu-item`}>
      <Button
        plain
        className={`${className} icon`}
        onClick={actionFn}
        title={label}
        a11yTitle={label}
      >
        <ButtonLiner>
          <Icon size="medium" />
        </ButtonLiner>
      </Button>
      <Button
        plain
        className={`${className} label`}
        onClick={actionFn}
        title={label}
        a11yTitle={label}
      >
        <ButtonLiner>
          <Text>{label}</Text>
        </ButtonLiner>
      </Button>
    </div>
  );
};

const ButtonLiner_: React.FunctionComponent<{
  className?: string;
}> = ({ className = '', children }) => (
  <div className={className}>{children}</div>
);

const ButtonLiner = styled(ButtonLiner_)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 12px;
  outline: none;
`;

const StyledMenuItemButton = styled(MenuItemButton)`
  /* MEDIA=PHONES */
  @media only screen and (max-width: 767px) {
    .button-inner {
      padding: 16px 24px;
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
  display: flex;
  flex-direction: row;
  justify-content: center;

  h1 {
    font-size: 32px;
    font-family: 'Roboto', sans-serif;
    font-weight: 100;
    text-transform: capitalize;
  }
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
            <ContextNav>
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
            </ContextNav>
            <Content>
              <Router>
                <Home path="/" />
                {/* <Debug path="debug" /> */}
                {/* <SyncStatus path="sync" /> */}
                <Project path=":projectId" />

                {/* <User path=":userId">
                  <Project path=":projectId" />
                </User> */}
              </Router>
            </Content>
            <StyledMainNav
              toggleSidebar={toggleSidebar}
              isSidebarOpen={isSidebarOpen}
            >
              <StyledMenuItemButton
                icon={Icons.Home}
                actionFn={() => navigate('/')}
                label="Beginscherm"
              />
              <StyledMenuItemButton
                icon={Icons.Projects}
                actionFn={() => {
                  alert('Projecten');
                }}
                label="Projecten"
              />
              <StyledMenuItemButton
                icon={Icons.Book}
                actionFn={() => {
                  alert('Verwerkingsinstructies');
                }}
                label="Verwerkingsinstructies"
              />
              <div className="context-menu-items">
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
                  actionFn={() => {
                    alert('Bevindingen');
                  }}
                  label="Bevindingen"
                />
                <StyledMenuItemButton
                  icon={Icons.MapLocation}
                  actionFn={() => {
                    alert('Bouwlagen');
                  }}
                  label="Bouwlagen"
                />
                <StyledMenuItemButton
                  icon={Icons.Cubes}
                  actionFn={() => {
                    alert('BIM modellen');
                  }}
                  label="BIM modellen"
                />
              </div>
            </StyledMainNav>
            <StyledFooter />
          </SidebarContext.Provider>
        </StyledWrapper>
      )}
    </CapabilitiesCheck>
  );
};
