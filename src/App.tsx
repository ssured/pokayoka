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
  overflow-y: scroll;

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
      grid-template-columns: repeat(9, 1fr);
      grid-template-areas:
        'ctx     ctx     ctx     ctx     ctx     ctx     ctx     ctx     nav'
        'content content content content content content content content nav'
        'footer  footer  footer  footer  footer  footer  footer  footer  footer';
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
        <div className="buttons">
          <span className="spacer" />
          <ToggleNavButton toggleSidebar={toggleSidebar} />
        </div>
        <Box fill direction="row">
          <Box fill>{children}</Box>
        </Box>
      </div>
    </aside>
  );
};

const StyledMainNav = styled(MainNav)`
  grid-area: nav;
  overflow: hidden;

  .fixed {
    position: fixed;
  }

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
    width: ${props => (props.isSidebarOpen ? '15em' : '4em')};
    padding: 0.5em;

    .buttons {
      display: flex;
      align-items: center;
      justify-content: center;

      margin-bottom: 10px;

      .spacer {
        width: 0;
      }
    }
  }

  /* MEDIA=PHONES */
  @media only screen and (max-width: 767px) {
    /* hide nav when not open */
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
      <ButtonLiner>
        <Icon size="medium" />
        <div className="spacer" />
        <Text>{label}</Text>
      </ButtonLiner>
    </Button>
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
  h1 {
    font-size: 48px;
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
            </StyledMainNav>
            <StyledFooter />
          </SidebarContext.Provider>
        </StyledWrapper>
      )}
    </CapabilitiesCheck>
  );
};
