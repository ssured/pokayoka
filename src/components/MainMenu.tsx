import React from 'react';
import tw from 'tailwind.macro';
import { jsx, div, nav, span } from '../utils/nano';
import { useToggle, useMedia } from 'react-use';
import styled from '@emotion/styled';

const Navbar = styled.nav(tw`block bg-cyan
  lg:flex lg:items-stretch
`);
const NavbarBrand = styled.div(
  tw`flex items-stretch flex-no-shrink text-light`
);
const NavbarBurger = styled.div(
  tw`flex items-center flex-no-shrink text-light ml-auto cursor-pointer mr-1
  lg:hidden`
);
const NavbarMenu = styled.div(tw`block shadow-lg -mx-1 px-1
  lg:flex lg:items-stretch lg:flex-grow lg:flex-no-shrink lg:shadow-none`);
const NavbarStart = styled.div(tw`justify-start
  lg:flex lg:items-stretch lg:mr-auto`);
const NavbarEnd = styled.div(tw`justify-end
  lg:flex lg:items-stretch lg:ml-auto`);
const NavbarItem = styled.div(tw`block p-1 relative leading-normal
  lg:flex lg:items-center flex-no-grow flex-no-shrink`);
const NavbarLink = styled.div(tw`block p-1 relative leading-normal
  lg:flex lg:items-center`);

const AppName = styled.span(tw`font-semibold text-3xl tracking-tight`);

const NavbarIconSVG = styled.svg(tw`fill-current h-2 w-2`);
const Hamburger: React.SFC<{ title?: string }> = ({ title }) => (
  <NavbarIconSVG viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    {title && <title>{title}</title>}
    <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
  </NavbarIconSVG>
);

export const MainMenu: React.FunctionComponent<{}> = ({ children }) => {
  const [menuOpen, toggleMenuOpen] = useToggle(false);
  const isLg = useMedia('(min-width: 992px');
  return (
    <React.Fragment>
      <Navbar>
        <NavbarBrand>
          <NavbarItem>
            <AppName>Pokayoka</AppName>
          </NavbarItem>
          <NavbarBurger onClick={() => toggleMenuOpen()}>
            <Hamburger title="Menu" />
          </NavbarBurger>
        </NavbarBrand>
        {(isLg || menuOpen) && (
          <NavbarMenu>
            <NavbarStart>
              <NavbarItem as="a">Home</NavbarItem>
              <NavbarItem as="a">Documentation</NavbarItem>
              <NavbarItem>
                <NavbarLink>More</NavbarLink>
              </NavbarItem>
            </NavbarStart>
            <NavbarEnd>
              <NavbarItem $as="a">Login</NavbarItem>
            </NavbarEnd>
          </NavbarMenu>
        )}
      </Navbar>
      {children}
    </React.Fragment>
  );
};
