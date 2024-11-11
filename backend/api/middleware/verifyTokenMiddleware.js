const jwt = require('jsonwebtoken');
const { revokedTokens } = require('../handler/authHandler');

const verifyTokenMiddleware = (request, h) => {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    console.log('Token tidak ditemukan');
    return h.response({
      status: 'fail',
      message: 'Token tidak ditemukan. Silakan login.',
    }).code(401).takeover();
  }

  const token = authHeader.split(' ')[1];
  
  // Log untuk memastikan token diperiksa dalam revokedTokens
  console.log('Token diterima:', token);
  console.log('Daftar token yang dicabut:', Array.from(revokedTokens));

  // Periksa apakah token sudah dicabut
  if (revokedTokens.has(token)) {
    console.log('Token telah dicabut');
    return h.response({
      status: 'fail',
      message: 'Token telah dicabut. Silakan login kembali.',
    }).code(401).takeover();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.auth = { userId: decoded.userId, role: decoded.role };
    return h.continue;
  } catch (error) {
    console.error('Token tidak valid:', error);
    return h.response({
      status: 'fail',
      message: 'Token tidak valid atau telah kedaluwarsa.',
    }).code(401).takeover();
  }
};

module.exports = verifyTokenMiddleware;
