import React from 'react';

import { useMachine } from 'use-machine';
import { assign } from 'xstate';
import { Login } from './forms/Login';
import axios from 'axios';

export interface UserProfile {
  username: string;
  token: string;
}
export const UserProfileContext = React.createContext<UserProfile>(
  (null as unknown) as UserProfile
);

interface LoginStateSchema {
  states: {
    signedOut: {};
    signingIn: {};
    signedIn: {};
  };
}

type LoginEvent =
  | { type: 'SIGN_IN'; username: string; password: string }
  | { type: 'SIGN_OUT' };

interface LoginContext {
  userProfile?: UserProfile;
  lastError?: string;
}

export const FrontGate: React.FunctionComponent<{}> = ({ children }) => {
  const machine = useMachine<LoginContext, LoginStateSchema, LoginEvent>(
    {
      id: 'frontgate',
      initial: 'signedOut',
      context: {},
      states: {
        signedOut: {
          on: { SIGN_IN: { target: 'signingIn' } },
        },
        signingIn: {
          invoke: {
            src: (ctx, event) =>
              event.type === 'SIGN_IN'
                ? axios
                    .create({
                      auth: {
                        username: event.username,
                        password: event.password,
                      },
                    })
                    .post('/auth/token')
                : Promise.reject('can only start from SIGN_IN event'),
            onDone: {
              target: 'signedIn',
              actions: ['test'],
              // actions: assign({
              //   userProfile: (
              //     ctx: LoginContext,
              //     event: { data: UserProfile }
              //   ) => event.data,
              //   lastError: undefined,
              // }),
            },
            onError: {
              target: 'signedOut',
              // actions: assign({
              //   userProfile: undefined,
              //   lastError: (ctx: LoginContext, event: { data: string }) =>
              //     event.data,
              // }),
            },
          },
        },
        signedIn: {
          on: { SIGN_OUT: { target: 'signedOut' } },
        },
      },
    },
    {
      actions: {},
    },
    {}
  );

  return machine.state.matches('signedOut') ? (
    <Login
      onSubmit={({ username, password }) => {
        machine.send({ type: 'SIGN_IN', username, password });
        return Promise.resolve();
      }}
    />
  ) : machine.state.matches('signingIn') ? (
    <div>Please wait signing in</div>
  ) : machine.state.matches('signedIn') ? (
    <UserProfileContext.Provider value={machine.context.userProfile!}>
      {children}
    </UserProfileContext.Provider>
  ) : (
    <div>ERROR should not happen</div>
  );
};
