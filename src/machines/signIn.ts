import { MachineConfig, assign, Assigner, AssignAction } from 'xstate';
import { ServerAPIPost_Token_Response } from '../../server/auth';

// from https://codesandbox.io/embed/239lj2xzqp

export interface SignInSchema {
  states: {
    dataEntry: {};
    awaitingResponse: {};
    emailErr: {
      states: {
        badFormat: {};
        noAccount: {};
      };
    };
    passwordErr: {
      states: {
        tooShort: {};
        incorrect: {};
      };
    };
    serviceErr: {};
    signedIn: {};
  };
}

export type SignInEvent =
  | { type: 'ENTER_EMAIL'; value: string }
  | { type: 'ENTER_PASSWORD'; value: string }
  | { type: 'EMAIL_BLUR' }
  | { type: 'PASSWORD_BLUR' }
  | { type: 'SUBMIT' }
  | { type: 'error.execution'; src: 'requestSignIn'; data: { code: number } }
  | {
      type: 'done.invoke.requestSignIn';
      data: ServerAPIPost_Token_Response;
    };

export interface SignInContext {
  email: string;
  password: string;
  tokens: ServerAPIPost_Token_Response | null;
}

export const signInAssign: (
  assignment:
    | Assigner<SignInContext, SignInEvent>
    | Partial<
        {
          [K in keyof SignInContext]:
            | ((
                extState: SignInContext,
                event: SignInEvent
              ) => SignInContext[K])
            | SignInContext[K]
        }
      >
) => AssignAction<SignInContext, SignInEvent> = assign;

export const signInMachineConfig: MachineConfig<
  SignInContext,
  SignInSchema,
  SignInEvent
> = {
  id: 'signIn',
  context: {
    email: '',
    password: '',
    tokens: null,
  },
  initial: 'dataEntry',
  states: {
    dataEntry: {
      on: {
        ENTER_EMAIL: {
          actions: 'cacheEmail',
        },
        ENTER_PASSWORD: {
          actions: 'cachePassword',
        },
        EMAIL_BLUR: {
          cond: 'isBadEmailFormat',
          target: 'emailErr.badFormat',
        },
        PASSWORD_BLUR: {
          cond: 'isPasswordShort',
          target: 'passwordErr.tooShort',
        },
        SUBMIT: [
          {
            cond: 'isBadEmailFormat',
            target: 'emailErr.badFormat',
          },
          {
            cond: 'isPasswordShort',
            target: 'passwordErr.tooShort',
          },
          {
            target: 'awaitingResponse',
          },
        ],
      },
    },
    awaitingResponse: {
      invoke: {
        src: 'requestSignIn',
        onDone: {
          target: 'signedIn',
        },
        onError: [
          {
            cond: 'isNoAccount',
            target: 'emailErr.noAccount',
          },
          {
            cond: 'isIncorrectPassword',
            target: 'passwordErr.incorrect',
          },
          {
            cond: 'isServiceErr',
            target: 'serviceErr',
          },
        ],
      },
    },
    emailErr: {
      onEntry: 'focusEmailInput',
      on: {
        ENTER_EMAIL: {
          target: 'dataEntry',
          actions: 'cacheEmail',
        },
      },
      initial: 'badFormat',
      states: {
        badFormat: {},
        noAccount: {},
      },
    },
    passwordErr: {
      onEntry: 'focusPasswordInput',
      on: {
        ENTER_PASSWORD: {
          target: 'dataEntry',
          actions: 'cachePassword',
        },
      },
      initial: 'tooShort',
      states: {
        tooShort: {},
        incorrect: {},
      },
    },
    serviceErr: {
      onEntry: 'focusSubmitBtn',
      on: {
        SUBMIT: {
          target: 'awaitingResponse',
        },
      },
    },
    signedIn: {
      onEntry: 'cacheToken',
      type: 'final',
    },
  },
  onDone: {
    actions: 'onAuthentication',
  },
};
