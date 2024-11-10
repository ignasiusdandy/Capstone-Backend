const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const registerHandler = async (request, h) => {
  const { name_user, email_user, password_user, role } = request.payload;
  const id_user = nanoid(16); 
  const created_at = new Date().toISOString(); 

  if (!email_user || !password_user) {
    const response = h.response({
      status: 'fail',
      message: 'Gagal mendaftarkan. Email dan password harus diisi.',
    });
    response.code(400);
    return response;
  }

  if (!role || !['user', 'community'].includes(role)) {
    return h.response({
      status: 'fail',
      message: 'Gagal mendaftarkan. ROLE harus "user" atau "community".',
    }).code(400);
  }

  try {
    const hashedPassword = await bcrypt.hash(password_user, 10);

    const [result] = await db.query(
      'INSERT INTO T_user (id_user, name_user, email_user, password_user, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id_user, name_user, email_user, hashedPassword, role, created_at]
    );

    const response = h.response({
      status: 'success',
      message: 'User berhasil didaftarkan',
      data: {
        userId: id_user,
      },
    });
    response.code(201);
    return response;

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const response = h.response({
        status: 'fail',
        message: 'Gagal mendaftarkan user. Email sudah digunakan.',
      });
      response.code(400);
      return response;
    }

    const response = h.response({
      status: 'error',
      message: 'Terjadi kesalahan pada server.',
    });
    response.code(500);
    return response;
  }
};


// const login = async (request, h) => {
//   const { email_user, password_user } = request.payload;

//   const [rows] = await pool.query(
//     'SELECT * FROM T_user WHERE email_user = ? AND password_user = ?',
//     [email_user, password_user]
//   );

//   if (rows.length === 0) {
//     return h.response({ success: false, message: 'Invalid credentials' }).code(401);
//   }

//   const user = rows[0];
//   const dashboard = user.Role === 'user' ? 'dashboardUser' : 'dashboardCommunity';

//   return h.response({ success: true, message: 'Login successful', dashboard });
// };

// const logout = async (request, h) => {
//   return h.response({ success: true, message: 'Logout successful' });
// };

module.exports = { registerHandler };
