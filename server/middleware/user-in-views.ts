import { Request, Response, NextFunction } from 'express';

export function userInViews() {
  return function userInViews(req: Request, res: Response, next: NextFunction) {
    res.locals.user = req.user;
    next();
  };
}
