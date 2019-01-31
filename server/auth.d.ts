import { RequestHandler } from 'express';

declare const authRouter: RequestHandler;
export default authRouter;

export type ServerAPIPost_Token_Response = {
  [token: string]: { expires: string };
};

export type ServerAPIGet_Account_Response = {
  id: string;
  username: string;
  profile: { [key: string]: string };
  databases: string[];
};
