const { registerHandler } = require("./handler/authHandler");

const routes = [
  {
    method: 'POST',
    path: '/register',
    handler: registerHandler,
  },
];

module.exports = routes;
