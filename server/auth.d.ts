import { RequestHandler } from 'express';

declare const authRouter: RequestHandler;
export default authRouter;

export type ServerAPIPost_Token_Response = {
  [token: string]: { expires: string };
};
