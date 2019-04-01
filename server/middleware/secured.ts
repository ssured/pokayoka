import { Request, Response, NextFunction } from 'express';

export function secured() {
  return function secured(req: Request, res: Response, next: NextFunction) {
    if (req.user) {
      return next();
    }
    req.session!.returnTo = req.originalUrl;
    res.redirect('/login');
  };
}
