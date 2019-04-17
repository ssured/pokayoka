import { RouteMatch, Router } from 'boring-router';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

export const router = Router.create(
  {
    gun: true,
    notFound: {
      $match: RouteMatch.rest,
    },
  },
  history
);
