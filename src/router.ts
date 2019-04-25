import { RouteMatch, Router } from 'boring-router';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

export const router = Router.create(
  {
    home: {
      $match: '',
    },
    projects: {
      $exact: true,
      $children: {
        new: true,
        projectId: {
          $match: RouteMatch.segment,
          $exact: true,
          $children: {
            settings: {
              $exact: true,
              $children: {
                addContact: true,
                siteId: {
                  $match: RouteMatch.segment,
                  $exact: true,
                  $children: {
                    buildingId: {
                      $match: RouteMatch.segment,
                      $exact: true,
                    },
                  },
                },
              },
            },
            snags: true,
          },
        },
      },
    },
    account: true,
    notFound: {
      $match: RouteMatch.rest,
    },
  },
  history
);
