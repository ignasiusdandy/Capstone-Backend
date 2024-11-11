const { registerHandler, loginHandler, logoutHandler } = require('./handler/authHandler');
const { createEmergency } = require('./handler/emergencyHandler');
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
  // {
  //   method: 'GET',
  //   path: '/api/dashboard',
  //   handler: (request, h) => {
  //     return h.response({
  //       status: 'success',
  //       message: 'Selamat datang di dashboard',
  //       data: request.auth,
  //     });
  //   },
  //   options: {
  //     pre: [verifyTokenMiddleware],
  //   },
  // },
  {
  method: 'POST',
  path: '/emergency/create',
  handler: createEmergency,
  options: {
    payload: {
      output: 'stream', // Atur output sebagai stream untuk menangani file
      parse: true,      // Parsing otomatis untuk multipart
      allow: 'multipart/form-data', // Izinkan jenis konten multipart/form-data
      maxBytes: 1024 * 1024 * 10, // Batasi ukuran file hingga 10MB (opsional)
    },
    pre: [verifyTokenMiddleware], // Tambahkan middleware token jika diperlukan
  },
},
];

module.exports = routes;
