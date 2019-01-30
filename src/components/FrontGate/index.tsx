import React, { useRef } from 'react';

import { useMachine } from 'use-machine';
import { signInMachineConfig, signInAssign } from '../../machines/signIn';
import { isEmail } from 'validator';

import { Loader } from '../Loader';

import {
  Form,
  H1,
  Label,
  Recede,
  Input,
  ErrMsg,
  Button,
  Authenticated,
  MetaWrapper,
  Pre,
} from './styles';

const delay = (func: (...args: any[]) => any) => setTimeout(() => func());

const NoAccountError = 1;
const WrongPasswordError = 2;
const NoResponseError = 3;

const isSuccess = () => Math.random() >= 0.8;
const generateErrCode = () => Math.floor(Math.random() * 3) + 1;

const contactAuthService = (email: string, password: string) =>
  new Promise<void | {
    code:
      | typeof NoAccountError
      | typeof WrongPasswordError
      | typeof NoResponseError;
  }>((resolve, reject) => {
    console.log(`email: ${email}`);
    console.log(`password: ${password}`);

    setTimeout(() => {
      if (isSuccess()) resolve();
      reject({ code: generateErrCode() });
    }, 1500);
  });

export const FrontGate: React.FunctionComponent<{}> = ({}) => {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const { state, send } = useMachine(
    signInMachineConfig,
    {
      actions: {
        focusEmailInput: () =>
          delay(() => emailInputRef.current && emailInputRef.current.focus()),
        focusPasswordInput: () =>
          delay(
            () => passwordInputRef.current && passwordInputRef.current.focus()
          ),
        focusSubmitBtn: () =>
          delay(() => submitBtnRef.current && submitBtnRef.current.focus()),
        cacheEmail: signInAssign({
          email: (ctx, evt) => (evt.type === 'ENTER_EMAIL' ? evt.value : ''),
        }),
        cachePassword: signInAssign({
          password: (ctx, evt) =>
            evt.type === 'ENTER_PASSWORD' ? evt.value : '',
        }),
        onAuthentication: () => {
          console.log('user authenticated');
        },
      },
      guards: {
        isBadEmailFormat: ctx => !isEmail(ctx.email),
        isPasswordShort: ctx => ctx.password.length <= 6,
        isNoAccount: (ctx, evt) => {
          console.log(evt);
          return !!(
            evt.type === 'error.execution' &&
            evt.src === 'requestSignIn' &&
            evt.data.code === 1
          );
        },
        isIncorrectPassword: (ctx, evt) => {
          console.log(evt);
          return !!(
            evt.type === 'error.execution' &&
            evt.src === 'requestSignIn' &&
            evt.data.code === 2
          );
        },
        isServiceErr: (ctx, evt) => {
          console.log(evt);
          return !!(
            evt.type === 'error.execution' &&
            evt.src === 'requestSignIn' &&
            evt.data.code === 3
          );
        },
      },
      services: {
        requestSignIn: ctx => contactAuthService(ctx.email, ctx.password),
      },
    },
    { email: '', password: '' }
  );

  const disableEmail =
    state.matches('passwordErr') ||
    state.matches('awaitingResponse') ||
    state.matches('serviceErr');
  const disablePassword =
    state.matches('emailErr') ||
    state.matches('awaitingResponse') ||
    state.matches('serviceErr');
  const disableSubmit =
    state.matches('emailErr') ||
    state.matches('passwordErr') ||
    state.matches('awaitingResponse');
  const fadeHeading =
    state.matches('emailErr') ||
    state.matches('passwordErr') ||
    state.matches('awaitingResponse') ||
    state.matches('serviceErr');

  return (
    <Form
      onSubmit={e => {
        e.preventDefault();
        send({ type: 'SUBMIT' });
      }}
      noValidate
    >
      <H1 fade={fadeHeading}>Pokayoka</H1>

      {/* email ---------------------- */}
      <Label htmlFor="email" disabled={disableEmail}>
        email
      </Label>
      <Input
        id="email"
        type="email"
        placeholder="charlie@gmail.com"
        onBlur={() => {
          send({ type: 'EMAIL_BLUR' });
        }}
        value={state.context.email}
        err={state.matches('emailErr')}
        disabled={disableEmail}
        onChange={e => {
          send({
            type: 'ENTER_EMAIL',
            value: e.target.value,
          });
        }}
        ref={emailInputRef}
        autoFocus
      />
      <ErrMsg>
        {state.matches({ emailErr: 'badFormat' }) &&
          "email format doesn't look right"}
        {state.matches({ emailErr: 'noAccount' }) &&
          'no account linked with this email'}
      </ErrMsg>

      {/* password ---------------------- */}
      <Label htmlFor="password" disabled={disablePassword}>
        password <Recede>(min. 6 characters)</Recede>
      </Label>

      <Input
        id="password"
        type="password"
        placeholder="Passw0rd!"
        value={state.context.password}
        err={state.matches('passwordErr')}
        disabled={disablePassword}
        onBlur={() => {
          send({ type: 'PASSWORD_BLUR' });
        }}
        onChange={e => {
          send({
            type: 'ENTER_PASSWORD',
            value: e.target.value,
          });
        }}
        ref={passwordInputRef}
      />
      <ErrMsg>
        {state.matches({ passwordErr: 'tooShort' }) && 'password too short'}
        {state.matches({ passwordErr: 'incorrect' }) && 'incorrect password'}
      </ErrMsg>

      {/* submit ---------------------- */}
      <Button
        type="submit"
        disabled={disableSubmit}
        loading={state.matches('awaitingResponse')}
        ref={submitBtnRef}
      >
        {state.matches('awaitingResponse') && (
          <>
            loading
            <Loader />
          </>
        )}
        {state.matches('serviceErr') && 'retry'}
        {!state.matches('awaitingResponse') &&
          !state.matches('serviceErr') &&
          'sign in'}
      </Button>
      <ErrMsg>
        {state.matches('serviceErr') && 'problem contacting server'}
      </ErrMsg>

      {/* authenticated -------------------------- */}
      {state.matches('signedIn') && (
        <Authenticated>
          <H1>authenticated</H1>
        </Authenticated>
      )}

      {/* meta -------------------------- */}
      <MetaWrapper>
        <Pre>
          <b>state:</b> {JSON.stringify(state.value, null, 2)}
        </Pre>

        <Pre>
          <b>context (ctx):</b> {JSON.stringify(state.context, null, 2)}
        </Pre>
      </MetaWrapper>
    </Form>
  );
};
