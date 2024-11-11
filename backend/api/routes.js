const { registerHandler, loginHandler, logoutHandler } = require('./handler/authHandler');
const verifyTokenMiddleware = require('./middleware/verifyTokenMiddleware');

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
  {
    method: 'POST',
    path: '/logout',
    handler: logoutHandler,
  },
  {
    method: 'GET',
    path: '/api/dashboard', 
    handler: (request, h) => {
      return h.response({
        status: 'success',
        message: 'Selamat datang di dashboard',
        data: request.auth, 
      });
    },
    options: {
      pre: [verifyTokenMiddleware], 
    },
  },
];

module.exports = routes;
