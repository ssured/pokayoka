import { Application } from 'express-ws';
import console from 'console';

export const useSPORouter = (app: Application, path: string) => {
  app.ws(path, (ws, req) => {
    console.log('hier ws', req.user);
    const user = req.user && req.user.userProfile && req.user.userProfile.id;

    ws.on('message', msg => {
      console.log('message', msg, user);
    });

    ws.send({
      type: 'userprofile',
      ...req.user.userProfile,
    });
  });
};
