const { registerHandler, loginHandler } = require('./handler/authHandler');

const routes = [
  {
    method: 'POST',
    path: '/register',
    handler: registerHandler,
  },
  {
    method: 'POST',
    path: '/login',
    handler: loginHandler,
  },
];

module.exports = routes;
