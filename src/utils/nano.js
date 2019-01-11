import { createElement } from 'react';
import { create } from 'nano-css';
import { addon as addonRule } from 'nano-css/addon/rule';
import { addon as addonCache } from 'nano-css/addon/cache';
import { addon as addonJsx } from 'nano-css/addon/jsx';

const nano = create({
  h: createElement,
});

addonRule(nano);
addonCache(nano);
addonJsx(nano);

const { put, rule, jsx } = nano;

export { nano, put, rule, jsx };

export const div = jsx.bind(null, 'div');
export const nav = jsx.bind(null, 'nav');
export const span = jsx.bind(null, 'span');
