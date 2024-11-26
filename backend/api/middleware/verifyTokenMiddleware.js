const jwt = require('jsonwebtoken');

const verifyTokenMiddleware = (request, h) => {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    console.log('Token tidak ditemukan');
    return h.response({
      status: 'fail',
      message: 'Token tidak ditemukan. Silakan login.',
    }).code(401).takeover();
  }

  const token = authHeader.split(' ')[1]; // Ekstrak token dari header Authorization

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifikasi token
    console.log('Token valid, decoded data:', decoded);

    // Validasi apakah decoded memiliki userId dan role
    if (!decoded.userId ) {
      console.log('Token tidak memiliki informasi yang diharapkan');
      return h.response({
        status: 'fail',
        message: 'Token tidak valid. Informasi tidak lengkap.',
      }).code(401).takeover();
    }

    // Jika valid, simpan data di request.auth
    request.auth = { userId: decoded.userId};
    return h.continue;

  } catch (error) {
    console.error('Invalid token', error);
    return h.response({
      status: 'fail',
      message: 'Invalid token',
    }).code(401).takeover();
  }
};

module.exports = verifyTokenMiddleware;
