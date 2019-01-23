import React from 'react';
import tw from 'tailwind.macro';
import { jsx, div, nav, span } from '../utils/nano';
import { useToggle, useMedia } from 'react-use';
import styled from '@emotion/styled';

const Base = nav(tw`block bg-cyan relative
  lg:flex lg:items-stretch
`);

export const Navbar = Base as typeof Base & {
  Brand: typeof NavbarBrand;
};

const NavbarBrand = div(tw`flex items-stretch flex-no-shrink text-light`);
Navbar.Brand = NavbarBrand;

const NavbarBurger = div(
  tw`flex items-center flex-no-shrink ml-auto
  text-light cursor-pointer mr-1
  lg:hidden`
);
const NavbarMenu = div(tw`block shadow-lg -mx-1 px-1
  lg:flex lg:items-stretch lg:flex-grow lg:flex-no-shrink lg:shadow-none`);
const NavbarStart = div(tw`justify-start
  lg:flex lg:items-stretch lg:mr-auto`);
const NavbarEnd = div(tw`justify-end
  lg:flex lg:items-stretch lg:ml-auto`);
const NavbarItem = div(tw`block p-1 relative leading-normal
  lg:flex lg:items-center flex-no-grow flex-no-shrink`);
const NavbarLink = div(tw`block p-1 relative leading-normal
  lg:flex lg:items-center`);

const AppName = span(tw`font-semibold text-3xl tracking-tight`);

const NavbarIconSVG = jsx('svg', tw`fill-current h-2 w-2`);
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
        <Navbar.Brand>
          <NavbarItem>
            <AppName>Pokayoka</AppName>
          </NavbarItem>
          <NavbarBurger onClick={() => toggleMenuOpen()}>
            <Hamburger title="Menu" />
          </NavbarBurger>
        </Navbar.Brand>
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
