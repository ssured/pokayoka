// Refactor of original code to display using a button instead of an anchor element
// https://github.com/makeflow/boring-router/blob/885ff96fd32f217d2ad26d0c01a507313a92d453/react/src/library/link.tsx

import { RouteMatch } from 'boring-router';
import { Button, ButtonProps } from 'grommet';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import React, {
  Component,
  EventHandler,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  SyntheticEvent,
} from 'react';
import { EmptyObjectPatch } from 'tslang';

function composeEventHandler<T extends SyntheticEvent>(
  handlers: (EventHandler<T> | undefined)[],
  breakOnDefaultPrevented = false
): EventHandler<T> {
  return event => {
    for (const handler of handlers) {
      if (handler) {
        handler(event);

        if (breakOnDefaultPrevented && event.defaultPrevented) {
          break;
        }
      }
    }
  };
}

export interface LinkProps<TRouteMatch extends RouteMatch>
  extends ButtonProps,
    Pick<HTMLAttributes<HTMLButtonElement>, 'onMouseEnter' | 'onFocus'> {
  to: TRouteMatch;
  params?: TRouteMatch extends RouteMatch<infer TParamDict>
    ? Partial<TParamDict> & EmptyObjectPatch
    : never;
  preserveQuery?: boolean;
  replace?: boolean;
  toggle?: boolean;
  leave?: boolean;
  children?: ReactNode;
  exact?: boolean;
}

@observer
export class RoutedButton<TRouteMatch extends RouteMatch> extends Component<
  LinkProps<TRouteMatch>
> {
  @observable
  private href = 'javascript:;';

  render(): ReactNode {
    const {
      to,
      params,
      preserveQuery,
      replace,
      toggle,
      onMouseEnter,
      onFocus,
      onClick,
      exact,
      ...props
    } = this.props;

    const active = exact ? to.$exact : to.$matched;

    return (
      <Button
        as="a"
        active={active}
        href={this.href}
        plain
        hoverIndicator="light-4"
        onMouseEnter={composeEventHandler([onMouseEnter, this.onMouseEnter])}
        onFocus={composeEventHandler([onFocus, this.onFocus])}
        onClick={composeEventHandler([onClick, this.onClick], true)}
        {...props}
      />
    );
  }

  @action
  private onMouseEnter = (): void => {
    this.updateHref();
  };

  @action
  private onFocus = (): void => {
    this.updateHref();
  };

  private onClick = (event: MouseEvent): void => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.button === 1 /* middle button */
    ) {
      return;
    }

    event.preventDefault();

    const { to, params, preserveQuery, replace, toggle = false } = this.props;
    let { leave } = this.props;

    if (leave === undefined) {
      leave = toggle && to.$matched;
    }

    if (replace) {
      to.$replace(params, { preserveQuery, leave });
    } else {
      to.$push(params, { preserveQuery, leave });
    }
  };

  private updateHref(): void {
    const { to, params, preserveQuery } = this.props;

    try {
      this.href = to.$ref(params, { preserveQuery });
    } catch (error) {
      this.href = 'javascript:;';
    }
  }
}
