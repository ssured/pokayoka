const pullNotify = require('pull-notify');

const notifyUpdate = pullNotify();
const currentState = () => Date.now();

module.exports = {
  notifyUpdate,
  currentState,
};
